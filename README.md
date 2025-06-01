# StockGPT - AI-Powered Stock Market Analysis Tool

StockGPT is an intelligent AI assistant designed to help users analyze and research stock market data. Built with Next.js and powered by Groq's Llama 4 Scout model, it provides real-time stock analysis, interactive charts, and conversational AI capabilities.

## 🌟 Features

### 🤖 AI-Powered Analysis
- **Intelligent Chat Interface**: Ask questions about stocks in natural language
- **Real-time Stock Data**: Get instant access to current stock prices and trends
- **Smart Symbol Detection**: Automatic chart generation when stock symbols are mentioned
- **Contextual Understanding**: AI understands market context and provides relevant insights

### 📊 Interactive Stock Charts
- **7-Day Price History**: Visualize stock performance over the last week
- **Real-time Updates**: Charts update automatically with new data
- **Responsive Design**: Optimized for both desktop and mobile viewing
- **Interactive Elements**: Hover for detailed price information

### 💬 Chat Management
- **Conversation History**: Save and manage all your stock analysis conversations
- **Session Management**: Create, update, and delete chat sessions
- **Persistent Storage**: Chat history is saved locally for future reference
- **Easy Navigation**: Quick access to previous analyses

### 🎯 User Experience
- **Interactive Onboarding**: Step-by-step guide for new users
- **Responsive Design**: Seamless experience across all devices
- **Modern UI**: Clean and intuitive interface
- **Real-time Updates**: Instant feedback and data updates

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or later
- npm or yarn
- Groq API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/stockgpt.git
   cd stockgpt
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the root directory:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 💡 Usage Guide

### Starting a New Analysis
1. Click "New Chat" to start a fresh conversation
2. Type your question about any stock (e.g., "What's the current price of AAPL?")
3. The AI will respond with analysis and automatically generate charts for mentioned stocks

### Using Stock Charts
- Charts are automatically generated when stock symbols are mentioned
- Hover over data points to see detailed price information
- Charts show 7-day price history by default

### Managing Chat History
- All conversations are automatically saved
- Access previous chats from the sidebar
- Delete or rename chat sessions as needed

## 🛠️ Technical Stack

- **Frontend Framework**: Next.js 15.3.3
- **UI Library**: React 19.0.0
- **AI Model**: Groq's Llama 4 Scout
- **Stock Data**: Yahoo Finance API
- **Charts**: Chart.js with react-chartjs-2
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **Storage**: Browser localStorage

## 🔒 Security Features

- Rate limiting on API endpoints
- Secure headers configuration
- Environment variable protection
- CORS protection
- XSS prevention

## 🚀 Deployment

### Deploying to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Configure environment variables:
   - `GROQ_API_KEY`: Your Groq API key
4. Deploy!

### Environment Variables

Required environment variables:
- `GROQ_API_KEY`: Your Groq API key for AI model access

## 📝 API Endpoints

### `/api/chat`
- **Method**: POST
- **Purpose**: Handle chat interactions with AI
- **Features**: 
  - Streaming responses
  - Rate limiting
  - Error handling

### `/api/stock`
- **Method**: GET
- **Purpose**: Fetch stock data
- **Parameters**: 
  - `symbol`: Stock symbol (e.g., AAPL)
- **Returns**: 7-day price history

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing framework
- [Groq](https://groq.com/) for the AI model
- [Yahoo Finance](https://finance.yahoo.com/) for stock data
- [Chart.js](https://www.chartjs.org/) for charting capabilities
