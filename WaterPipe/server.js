// ===== BACKEND SERVER (server.js) =====
// Run this with: node server.js

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

const COMPANY_CONTEXT = `
<static_context>
'The student has arrived at home to find their house has been flooded - a water pipe in the building has exploded and is wreaking havoc.'

The ideal resolution to this issue is to self regulate, call the local water provider to have the water turned off, and quickly remove any significant documents or personal items. The strategy they need to use is 'Reframing their thinking' which will allow them to handle the present situation, and then use their additional methods of physical strength and resilience, relaxation techniques, and a strong support network to get through this situation.

Please adhere to the following guidelines:
1. Describe the scenario as though in a book - explain what the student is seeing and hearing, and finish each response with 'What would you like to do next?'
2. Allow the student to make mistakes, but provide assistance in the ideal methods if they are struggling or stuck on what to do next.

The contextual information about these methods is attached below.

Managing Stress: Reframe Thinking
The practice of self-care spans across physical, mental and emotional domains, each being crucial for maintaining a balanced state of wellbeing. When diligently integrated into daily routines, self-care activities serve as a powerful antidote to stress, helping individuals navigate through stressful situations with a clearer mind and a healthier body.

Beginning with self-care for mental wellbeing, there are four tools that are incredibly useful for navigating stressful situations by becoming a realistic optimist. 

Realistic optimism means seeing things as they are, accurately, then making the best of them to maintain a positive outlook on life whilst been aware of the difficulties that exist. To be a realistic optimist begin by challenging negative thoughts. 
Understanding Your Negative Thinking
The first tool useful in becoming a realistic optimist is challenging your negative thinking. Cognitive reappraisal involves thinking differently to reduce unhelpful emotional responses to stressors. 

The most common forms of negative thinking fall under the umbrella term of cognitive distortions. These are patterns of thoughts that lead to inaccurate and irrational conclusions. These cognitive errors play a significant role in influencing our emotions, behaviours, and overall mental wellbeing. 

ABCDE – Five Step Model of Positive Thinking
Recognising your habitual thinking styles and then actively challenging your perspective is a way forward to creating feelings, thoughts and behaviours that align with realistic optimism. Seeing a situation from a different perspective may change your understanding of the situation. 

A tool that is useful in challenging your negative perspective is the ABCDE model by Martin Seligman.  ABCDE stands for [flip cards that offer more detailed information on a new screen]

Adversity: The obstacle faced.
Capture a detailed, specific, fact only (who/what/when/where) truth statement that describes the situation. 
Example: “I got rejected today from an interesting program.”

Belief: How you viewed it.
What thoughts did you have as the situation unfolded? Avoid editing or creating a polite version of your thoughts. 
Example: “Man, this always happens.” “I’m just not good enough.” “It’s all about who you know, and I don’t know anybody.” “Maybe I’m not cut out for this sort of thing.”

Consequence: What you did in response to the obstacle.
What is your experience of the result? What is the emotional impact or your reactions? Do the consequences make sense given the beliefs?
Example: “I felt worse and worse thinking this way. I began to not take any action on other projects that I wanted or needed to do today. I felt pretty low, and I began comparing myself negatively to others that I thought were better off than me.”
•	Disputation → Argue against the pessimistic feelings by considering evidence, alternatives, implication and usefulness of your beliefs.

Disputation: Argue against the pessimistic feelings.
Write down as many alternative interpretations of the facts as you can. Can you find evidence that might dispute your belief? Does that put your belief into perspective?
Example: That’s not completely true because I know a lot of great people, and some of them are in great positions. I have achieved great things like this in the past.
Example: It really is only for one week, it’s not like I got rejected from Yale.
Example: The most likely outcome of this is that I put my energy into another big project I’m currently working on, and I can work harder and be more focused on this project and that will help me handle the rejection from the scholarship.

Energy: Benefits of moving from negative to positive thinking.
Describe to yourself how these alternative beliefs and narratives make you feel. If your mood, behaviour or energy is improved, invite yourself to experiment with it more.
Example: My energy became more focused and clear. I felt much more competent in my abilities and in my future. My behaviour changed by getting me back to working hard on the things that matter to me, because I want a positive future for myself. The solutions I saw were about what I could DO for myself, rather than let the world happen to me.


Challenging your perspective can be difficult. The following is an additional list of techniques to consider with each of the negative thinking patterns that have been covered. 

All-or-Nothing
Seeing things in extremes e.g. only good or bad, with no middle ground.
•	Mindfulness: Practice mindfulness to become aware of your thought patterns. When you catch yourself thinking in extremes, pause and try to find the middle ground. Ask yourself, "Is there a more balanced perspective?"
•	Challenge Extremes: Counter all-or-nothing thoughts by identifying exceptions or shades of grey in a situation. For instance, if you're thinking, "I'm a complete failure," remind yourself of past successes and areas where you've done well.
•	Set Realistic Goals: Instead of setting perfectionist goals, aim for realistic and achievable objectives. Celebrate progress and partial successes along the way.

Catastrophising:
Automatically assuming the worst.
•	Reality Testing: Challenge catastrophic thoughts by asking yourself, "Is this the worst-case scenario, or are there alternative outcomes?" Often, the worst-case scenario is unlikely to happen.
•	Problem-Solving: If you're worried about a potential catastrophe, break it down into smaller, manageable steps. Develop an action plan to address each step, which can make the situation feel more controllable.
•	Positive Self-Talk: Replace catastrophic thoughts with positive and reassuring self-talk. Remind yourself of past challenges you've overcome and your ability to adapt and cope.

Personalisation and blame 
Taking responsibility for things outside of one’s control or blaming oneself excessively.
•	Reflect on Responsibility: Assess whether you genuinely played a significant role in the situation. Consider external factors and other people's contributions. Challenge the belief that everything is your fault.
•	Feedback and Perspective: Seek feedback and perspectives from others involved in the situation. Sometimes, external viewpoints can provide a more balanced understanding.
•	Positive Affirmations: Use positive affirmations to counter self-blame. Remind yourself that you're human, and everyone makes mistakes. Focus on self-compassion and forgiveness.

Filtering
Focusing solely on negative details while ignoring positive ones.  
Resilience techniques to overcome this thinking trap:
•	Counter Negatives: Whenever you catch yourself filtering out positives, consciously make an effort to identify and acknowledge the positive aspects of a situation.
•	Keep Perspective: Reflect on the bigger picture and the context of the situation. Ask yourself if focusing solely on the negative detail is justified or if it's an overreaction.
•	Gratitude Practice: Develop a gratitude journal or practice to regularly list things you're thankful for. This can help shift your focus toward the positive aspects of life.

Activity: Your thinking patterns (matching with feedback)
Review the following scenarios and identify which thinking trap is occurring and what potential resilience technique could be used to overcome this thinking trap.

You make a small mistake on a project, and you immediately start freaking out, convinced that you're going to get fired, and your career is over. You feel overwhelmed and anxious, unable to focus on finding a solution.
•	Thinking Trap: Catastrophising. This is evident from the immediate leap to the worst-case scenario (getting fired and career ruin) from a small mistake.
•	Resilience Technique: Reality Testing. Ask yourself, "Is this really the worst-case scenario, or are there other more likely outcomes?" Also, breaking down the problem into smaller steps (like how to correct the mistake) can help manage the anxiety and focus on constructive actions.

A friend cancels plans for the third time in a row, and you immediately assume they don't value your friendship anymore and never want to spend time with you. You start feeling hurt and ignored and consider ending the friendship altogether.
•	Thinking Trap: All-or-Nothing Thinking. This is seen in the extreme conclusion that the friend doesn't value the friendship at all, based solely on the cancellations.
•	Resilience Technique: Challenge Extremes. Reflect on past positive interactions to provide a more balanced perspective. Also, consider direct communication with the friend to understand their reasons for cancellation, rather than jumping to conclusions.

After receiving a critical review at work, you begin to believe you're a total failure and will never succeed in your career. You feel demotivated and start avoiding new projects, convinced that you're not capable of achieving anything.
•	Thinking Trap: Filtering. This occurs when focusing only on the negative aspects of the review and disregarding any positive feedback or areas of improvement.
•	Resilience Technique: Counter Negatives. Consciously identify any positive feedback or constructive criticism in the review. Keeping Perspective can also help; understanding that one review does not define your entire career.

During a group discussion, someone disagrees with your perspective, and you start feeling personally attacked, assuming they don't respect your opinions. You respond defensively, refusing to consider any other viewpoints.
•	Thinking Trap: Personalisation. Assuming the disagreement is a personal attack indicates a tendency to take things too personally, even when they might not be intended that way.
•	Resilience Technique: Reflect on Responsibility and Feedback. Assess whether the disagreement is genuinely about disrespect or just a difference in opinion. Seeking feedback from a neutral third party can also provide a more balanced view of the situation. Additionally, practicing mindfulness to stay present and non-reactive can be beneficial in such situations.

Strengths-Based Optimism
The third tool in becoming a realistic optimist is to shift from a deficit model – what’s wrong with us? to a strengths model – what’s right with us? 
Rather than dwelling on our deficiencies and their causes, acknowledging our strengths provides us with another resource to help ourselves. It’s a simple idea based on:
•	Identifying what you do well.
•	Doing more of it.
•	Building on it.
Reflecting on strengths develops an awareness of achievements that may not have been previously acknowledged. By forming a balanced view of our strengths we’re able to act constructively and where necessary make positive change. 
Having strengths-based optimism doesn’t mean problems and difficulties are ignored; instead, it identifies the positive aspects of our personality in the form of strengths that might lay the basis to address the challenges we face. 
Strengths-based optimism recognises that:
•	Change is inevitable.
•	The ability to act as a result of change is within us.
•	Perception, language and self-talk can create our reality.
•	It’s a person’s unique strengths that influence their life.
•	Using our strengths gives us the potential to learn and grow.
</static_context>
`;

const SCENARIO_FEEDBACK = `
Great work completing the flooding scenario! Let's review the key learning points:

1. Initial Response: You demonstrated stress management through reframing techniques
2. Problem-Solving: You took practical steps to address the situation
3. Resource Management: You protected important items while maintaining safety

Additional Resources:
- Emergency Services Guide: https://www.ses.vic.gov.au/flood-guides
- Home Insurance Claims: https://www.insurance.gov.au/flood-claims
- Mental Health Support: https://www.beyondblue.org.au/crisis-support

Would you like to:
1. Review the scenario again
2. Try another scenario
3. Exit the simulation
`;

// Store session data (in production, use a proper database)
const sessions = new Map();

const tools = [
  {
    name: "update_progress",
    description: "Update the user's progress when they complete key objectives in the flooding scenario",
    input_schema: {
      type: "object",
      properties: {
        waterProviderCalled: {
          type: "boolean",
          description: "Set to true when user calls water provider, emergency services, or plumber"
        },
        waterTurnedOff: {
          type: "boolean", 
          description: "Set to true when user turns off the water or water gets turned off"
        },
        itemsSecured: {
          type: "boolean",
          description: "Set to true when user secures/saves important documents or personal items"
        }
      },
      required: []
    }
  }
];

const systemPrompt = `You are an immersive education chatbot helping a student navigate a home flooding emergency scenario.

IMPORTANT: When the user's actions demonstrate they have completed any of these key objectives, use the update_progress tool:
1. Calling water provider/emergency services/plumber → set waterProviderCalled: true
2. Turning off water or water being turned off → set waterTurnedOff: true  
3. Securing important documents/personal items → set itemsSecured: true

Maintain the story-like narrative style and always end with "What would you like to do next?"

Keep responses to 3 lines or less to maintain engagement.`;

function isScenarioComplete(progress) {
  return progress.waterProviderCalled && 
         progress.waterTurnedOff && 
         progress.itemsSecured;
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
      max_tokens: 300,
      temperature: 1,
      system: systemPrompt,
      tools: tools,
      messages: [{ role: "user", content: COMPANY_CONTEXT }]
    });

    const session = {
      id: sessionId,
      messageHistory: [{ role: "assistant", content: response.content }],
      progress: {
        waterProviderCalled: false,
        waterTurnedOff: false,
        itemsSecured: false
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
      max_tokens: 300,
      temperature: 1,
      system: systemPrompt,
      tools: tools,
      messages: session.messageHistory
    });

    // Handle tool calls
    const toolCalls = response.content.filter(block => block.type === 'tool_use');
    
    for (const toolCall of toolCalls) {
      if (toolCall.type === 'tool_use' && toolCall.name === 'update_progress') {
        // Update progress
        if (toolCall.input.waterProviderCalled !== undefined) {
          session.progress.waterProviderCalled = toolCall.input.waterProviderCalled;
        }
        if (toolCall.input.waterTurnedOff !== undefined) {
          session.progress.waterTurnedOff = toolCall.input.waterTurnedOff;
        }
        if (toolCall.input.itemsSecured !== undefined) {
          session.progress.itemsSecured = toolCall.input.itemsSecured;
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

// ===== FRONTEND HTML (save as public/index.html) =====