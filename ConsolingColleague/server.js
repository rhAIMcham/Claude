//installed via guide
const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));


//Declared in the terminal session running it
const anthropic = new Anthropic({
  apiKey: require('fs').readFileSync(require('path').join(__dirname, 'api_key_secret'), 'utf8').trim()
});


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

// Using a map was in a guide/template from anthropic, but I think we need this to be stored on a proper server for deployment?
const sessions = new Map();

//Tools to track completion of 4 booleans to determine if the sim is completed.
const tools = [
  {
    name: "update_progress",
    description: "Update the user's progress when they demonstrate key counseling and stress management skills",
    input_schema: {
      type: "object",
      properties: {
        empathyShown: {
          type: "boolean",
          description: "Set to true when user shows genuine empathy, active listening, or emotional support."
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

// Function to create system prompt with workplace context
function createSystemPrompt(workplaceContext) {
  const workplace = workplaceContext || 'a typical office environment';
  
  return `You are an immersive educational chatbot. 
Your role is Alex, a stressed coworker messaging through Teams/instant chat. 
Speak only in text, as though messaging on teams or slack. Reveal more factors stressing you as the conversation continues.

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

WORKPLACE CONTEXT: ${workplace}

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
}

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
    const { workplaceContext } = req.body;
    const contextualizedPrompt = createSystemPrompt(workplaceContext);

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 150,
      temperature: 0.5,
      system: contextualizedPrompt,
      tools,
      messages: [{ role: "user", content: "Start the conversation" }]
    });

    console.log('Claude response received'); // Debug log

    const session = {
      id: sessionId,
      messageHistory: [],
      systemPrompt: contextualizedPrompt,
      workplaceContext,
      progress: {
        empathyShown: false,
        stressCauseIdentified: false,
        techniqueUsed: false,
        planCreated: false
      }
    };

    // Handle potential tool_use on first turn
    const toolCalls = response.content.filter(b => b.type === 'tool_use');
    if (toolCalls.length > 0) {
      session.messageHistory.push({ role: "assistant", content: response.content });

      for (const toolCall of toolCalls) {
        if (toolCall.name === 'update_progress') {
          const inp = toolCall.input || {};
          if (inp.empathyShown !== undefined) session.progress.empathyShown = inp.empathyShown;
          if (inp.stressCauseIdentified !== undefined) session.progress.stressCauseIdentified = inp.stressCauseIdentified;
          if (inp.techniqueUsed !== undefined) session.progress.techniqueUsed = inp.techniqueUsed;
          if (inp.planCreated !== undefined) session.progress.planCreated = inp.planCreated;

          session.messageHistory.push({
            role: "user",
            content: [{
              type: "tool_result",
              tool_use_id: toolCall.id,
              content: "Progress updated successfully"
            }]
          });
        }
      }

      // Second call to get actual text reply
      response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 150,
        temperature: 0.5,
        system: contextualizedPrompt,
        tools,
        messages: session.messageHistory
      });
    }

    // Store final assistant content for start
    session.messageHistory.push({ role: "assistant", content: response.content });
    sessions.set(sessionId, session);

    res.json({
      sessionId,
      response: contentBlocksToString(response.content) || "",
      progress: session.progress,
      isComplete: false
    });
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ error: 'Failed to start session', details: error.message });
  }
});


// Send message
app.post('/api/message', async (req, res) => {
  try {
    const { sessionId, message } = req.body;
    const session = sessions.get(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    // 1) Add user message
    session.messageHistory.push({ role: "user", content: message });

    // 2) First model call
    let response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 150,
      temperature: 0.5,
      system: session.systemPrompt,
      tools,
      messages: session.messageHistory
    });

    // 3) Handle tool calls (may be none)
    const toolCalls = response.content.filter(b => b.type === 'tool_use');

    if (toolCalls.length > 0) {
      // Add the assistant message with tool_use blocks to history
      session.messageHistory.push({ role: "assistant", content: response.content });

      // Apply all tool updates + add tool_results
      for (const toolCall of toolCalls) {
        if (toolCall.name === 'update_progress') {
          const inp = toolCall.input || {};
          if (inp.empathyShown !== undefined) session.progress.empathyShown = inp.empathyShown;
          if (inp.stressCauseIdentified !== undefined) session.progress.stressCauseIdentified = inp.stressCauseIdentified;
          if (inp.techniqueUsed !== undefined) session.progress.techniqueUsed = inp.techniqueUsed;
          if (inp.planCreated !== undefined) session.progress.planCreated = inp.planCreated;

          // Push tool_result (as a user message per Anthropic spec)
          session.messageHistory.push({
            role: "user",
            content: [{
              type: "tool_result",
              tool_use_id: toolCall.id,
              content: "Progress updated successfully"
            }]
          });
        }
      }

      // 4) Second model call (now that tool_results are in history)
      response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 150,
        temperature: 0.5,
        system: session.systemPrompt,
        tools,
        messages: session.messageHistory
      });

      // Add the assistant’s follow-up (now includes text)
      session.messageHistory.push({ role: "assistant", content: response.content });
    } else {
      // No tools: just add the assistant message
      session.messageHistory.push({ role: "assistant", content: response.content });
    }

    // 5) Prepare reply to client
    const isComplete = isScenarioComplete(session.progress);
    let responseText = contentBlocksToString(response.content);

    if (isComplete) {
      responseText = SCENARIO_FEEDBACK;
      //TODO: Add in disabling text area, add button to reset experience.
    }

    res.json({
      response: responseText || "", // empty string if somehow still no text
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
