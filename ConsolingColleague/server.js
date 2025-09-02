const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files from public directory

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY, // Make sure to set this environment variable
});

// Removed COMPANY_CONTEXT - everything is now in systemPrompt

const SCENARIO_FEEDBACK = `
Excellent work helping your coworker manage their stress! Let's review what you accomplished:

✅ Empathetic Listening: You showed genuine care and created a safe space for sharing
✅ Root Cause Analysis: You helped identify the core stress factors affecting them
✅ Stress Management Techniques: You guided them through practical coping strategies  
✅ Action Planning: You worked together to create a realistic plan for moving forward

Key Skills Demonstrated:
• Active listening and empathy
• Problem-solving and analytical thinking
• Knowledge of stress management techniques
• Collaborative planning and support

Additional Resources for Stress Management:
- Beyond Blue: https://www.beyondblue.org.au/
- Headspace Meditation: https://www.headspace.com/
- Employee Assistance Programs: Contact your HR department
`;

// Store session data (in production, use a proper database)
const sessions = new Map();

const tools = [
  {
    name: "update_progress",
    description: "Update the user's progress when they demonstrate key counseling and stress management skills",
    input_schema: {
      type: "object",
      properties: {
        empathyShown: {
          type: "boolean",
          description: "Set to true when user shows genuine empathy, active listening, or emotional support"
        },
        stressCauseIdentified: {
          type: "boolean", 
          description: "Set to true when user helps identify the main stress cause (environmental, employment, relationship, work, money, family or financial),"
        },
        techniqueUsed: {
          type: "boolean",
          description: "Set to true when user guides through a stress management technique (ABCDE, reframing, challenging negative thoughts, etc.)"
        },
        planCreated: {
          type: "boolean",
          description: "Set to true when user collaborates to create a practical plan for reducing stress"
        }
      },
      required: []
    }
  }
];

const systemPrompt = `You are an immersive educational chatbot. Your role is Alex, a stressed coworker messaging through Teams/instant chat. Speak only in text, as though messaging on teams or slack. Reveal more factors stressing you as the conversation continues.

CRITICAL FORMATTING RULES:
- You are ONLY typing messages in a chat app - no descriptions, no narration, no prose
- NEVER write things like "Alex types:" or "Alex says:" or describe what you're doing
- NEVER use asterisks for actions like *sighs* or *looks tired*
- Just send direct messages exactly as they would appear in Teams/Slack
- Keep messages short and natural (1-3 sentences typically)
- Use casual texting language when appropriate

CHARACTER BACKGROUND:
- You're a shy, nervous coworker who is genuinely stressed and overwhelmed
- mention one stressor at a time
- Main stressors: work deadlines.
- secondary stressors: financial stress due to unexpected home repairs
- third stressors: relationship stress due to being busy with work
- You respond well to empathy and genuine listening
- You become more open as the user shows care
- You're willing to try stress management techniques when suggested kindly
- You gradually become calmer and more hopeful with good support

CONVERSATION STYLE:
- Text like a real person would in instant messaging
- Mention only what the user has asked about. Wait for them to ask about your relationship and work before discussing it
- Send multiple short messages when expressing complex thoughts
- Show emotion through word choice and punctuation, not descriptions
- Be authentic - sometimes type quickly with typos when emotional
- Use "yeah", "idk", "tbh" etc. naturally

STRESS MANAGEMENT KNOWLEDGE:
You're aware of basic concepts like the ABCDE model, reframing techniques, and cognitive distortions, but you need guidance to actually apply them effectively.

IMPORTANT: Use the update_progress tool when the user:
1. Shows empathy/active listening → empathyShown: true
2. Helps identify main stress cause → stressCauseIdentified: true  
3. Guides through stress techniques → techniqueUsed: true
4. Creates action plan together → planCreated: true`;

function isScenarioComplete(progress) {
  return progress.empathyShown && 
         progress.stressCauseIdentified && 
         progress.techniqueUsed &&
         progress.planCreated;
}

function contentBlocksToString(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join("\n");
  }
  return "";
}


// Start new session
app.post('/api/start', async (req, res) => {
  try {
    const sessionId = Date.now().toString();
    
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 150,
      temperature: 0.5,
      system: systemPrompt,
      tools: tools,
      messages: [{ role: "user", content: "Start the conversation" }]
    });

    const session = {
      id: sessionId,
      messageHistory: [{ role: "assistant", content: response.content }],
      progress: {
        empathyShown: false,
        stressCauseIdentified: false,
        techniqueUsed: false,
        planCreated: false
      }
    };

    sessions.set(sessionId, session);

    res.json({
      sessionId,
      response: contentBlocksToString(response.content),
      progress: session.progress,
      isComplete: false
    });
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

// Send message
app.post('/api/message', async (req, res) => {
  try {
    const { sessionId, message } = req.body;
    const session = sessions.get(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    session.messageHistory.push({ role: "user", content: message });
    
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 150,
      temperature: 0.5,
      system: systemPrompt,
      tools: tools,
      messages: session.messageHistory
    });

    // Handle tool calls
    const toolCalls = response.content.filter(block => block.type === 'tool_use');
    
    for (const toolCall of toolCalls) {
      if (toolCall.type === 'tool_use' && toolCall.name === 'update_progress') {
        // Update progress
        if (toolCall.input.empathyShown !== undefined) {
          session.progress.empathyShown = toolCall.input.empathyShown;
        }
        if (toolCall.input.stressCauseIdentified !== undefined) {
          session.progress.stressCauseIdentified = toolCall.input.stressCauseIdentified;
        }
        if (toolCall.input.techniqueUsed !== undefined) {
          session.progress.techniqueUsed = toolCall.input.techniqueUsed;
        }
        if (toolCall.input.planCreated !== undefined) {
          session.progress.planCreated = toolCall.input.planCreated;
        }
        
        session.messageHistory.push({ role: "assistant", content: response.content });
        session.messageHistory.push({
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: toolCall.id,
              content: "Progress updated successfully"
            }
          ]
        });
      }
    }

    if (toolCalls.length === 0) {
      session.messageHistory.push({ role: "assistant", content: response.content });
    }

    const isComplete = isScenarioComplete(session.progress);
    let responseText = contentBlocksToString(response.content);
    
    if (isComplete) {
      responseText = SCENARIO_FEEDBACK;
    }

    res.json({
      response: responseText,
      progress: session.progress,
      isComplete
    });
  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});