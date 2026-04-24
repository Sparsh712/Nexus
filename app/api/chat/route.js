import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request) {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is not configured");
    }

    const { prompt, enableWebSearch = true } = await request.json();
    
    if (!prompt) {
      throw new Error("No prompt provided");
    }

    const openaiClient = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': 'https://newealth.com',
        'X-Title': 'NewWealth AI',
      },
    });

    // Log API call attempt
    console.log("Calling OpenRouter API with prompt:", prompt.substring(0, 100) + "...");
    console.log("Web search enabled:", enableWebSearch);

    // Set system context for financial advisor role with web search context
    const messages = [
      {
        role: "system",
        content: `You are an expert financial advisor with deep knowledge of mutual funds, stocks, and investment strategies.
          
          IMPORTANT FORMATTING INSTRUCTIONS:
          - DO NOT use hash symbols (#) or asterisks (**) for headings
          - Use simple UPPERCASE TEXT for section titles (e.g., KEY POINTS)
          - Use bullet points (•) or dashes (-) for all lists and sub-points
          - Keep formatting clean and easy to read
          - Headings should be plain text without any special formatting
          
          Response Guidelines:
          • Keep responses short and focused on the user's question
          • Use simple language, avoiding technical jargon
          • Format advice in clear, numbered points or bullet points
          - When using web search results, prioritize recent and reliable financial information
          - Always cite sources when using current market data or recent news
          • If uncertain, be transparent about limitations
          • Focus on educational guidance, not specific investment advice
          • Stay professional and factual in responses
          - When current market data is available, use it to provide more accurate insights`
      },
      { role: "user", content: prompt }
    ];

    console.log(`Attempting chat completion with prompt:`, prompt.substring(0, 100) + "...");
    
    // Prepare the request configuration
    const requestConfig = {
      messages: messages,
      temperature: 1,
      max_tokens: 1024,
      top_p: 1,
      stream: true,
    };

    // Configure model and web search based on enableWebSearch flag
    if (enableWebSearch) {
      // Option 1: Use the :online variant (simpler approach)
      requestConfig.model = "google/gemini-2.5-flash";
      
      // Option 2: Alternative - use web plugin explicitly with custom settings
      // Uncomment the lines below and comment the line above to use the plugin approach
      /*
      requestConfig.model = "google/gemini-2.5-pro";
      requestConfig.plugins = [
        {
          id: "web",
          max_results: 5, // Default is 5, can adjust between 1-10
          search_prompt: "Find the most recent and relevant financial information about this topic:" // Custom search prompt
        }
      ];
      */
      
      // Option 3: Use Google's built-in web search for Gemini (alternative)
      // Uncomment the lines below to use Google's native web search instead
      /*
      requestConfig.model = "google/gemini-2.5-pro";
      requestConfig.web_search_options = {
        search_context_size: "medium" // low, medium, or high
      };
      */
      
      console.log("Using model with web search:", requestConfig.model);
    } else {
      // Use standard model without web search
      requestConfig.model = "google/gemini-2.5-pro";
      console.log("Using standard model without web search");
    }
    
    const chatStream = await openaiClient.chat.completions.create(requestConfig);
    
    console.log("Chat stream created successfully");
    return createStreamResponse(chatStream);

    // Helper function to create stream response
    function createStreamResponse(chatStream) {
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of chatStream) {
              const content = chunk.choices[0]?.delta?.content || "";
              if (content) {
                controller.enqueue(new TextEncoder().encode(content));
              }
            }
            controller.close();
          } catch (error) {
            console.error("Stream error:", error);
            controller.error(error);
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain",
          "Cache-Control": "no-cache",
        },
      });
    }

  } catch (error) {
    console.error("Chat API error:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "Chat service is not properly configured" },
        { status: 503 }
      );
    }

    if (error.message === "No prompt provided") {
      return NextResponse.json(
        { error: "Please provide a question or message" },
        { status: 400 }
      );
    }

    if (error.message?.includes('401')) {
      return NextResponse.json(
        { error: "Authentication failed with the chat service" },
        { status: 401 }
      );
    }

    if (error.message?.includes('429')) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Handle web search specific errors
    if (error.message?.includes('web search')) {
      return NextResponse.json(
        { error: "Web search is temporarily unavailable. Try again later." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to process chat request" },
      { status: 500 }
    );
  }
}