import { useAIChatbot, type Message } from '../hooks/useAIChatbot';

type personaType = 'general' | 'learning-coach' | 'financial-expert' | 'legal-expert' | 'math-reasoning';

export function sendInitialMessage(aiPersona: personaType){ 
    if (aiPersona == 'general'){

    }




}
//         // Check if this is a new chat and send learning coach welcome message
//         if (msgs.length === 0 && aiPersona === 'learning-coach') {
//           // Send welcome message
//           sendMessage({
//             chatId,
//             role: 'assistant',
//             content: {
//               text: `Hi! I'm your Learning Coach. 👋\n\nI'm here to help you understand and learn from your documents. I'll:\n\n• Break down complex concepts into easy-to-understand explanations\n• Ask you questions to check your understanding\n• Provide examples and analogies to make things clearer\n• Help you connect ideas across different parts of the document\n\nFeel free to ask me anything about ${selectedDocTitle ?? 'your documents'}! I'm here to make learning easier and more engaging for you.`
//             },
//             messageType: 'text',
//           }).then((welcomeMsg) => {
//             if (welcomeMsg) {
//               setMessages([welcomeMsg]);
//             }
//           }).catch(console.error);
//         }
//       };
//       void loadAndCheckWelcome();
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }

