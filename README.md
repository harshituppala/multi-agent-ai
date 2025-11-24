Multi-Agent Orchestrator

This project simulates a simple multi-agent workflow that processes a user query through distinct steps: researching a topic, analyzing the information, identifying the user’s intent, and generating a final response.
It is built with Node.js, Express, and a plain HTML/CSS/JavaScript frontend.

Overview

The system sends the user’s query through three backend agents:
•	Research Agent – extracts a topic and fetches information from the Wikipedia REST API
•	Analysis Agent – breaks the summary into key points and estimates complexity
•	Task Agent – identifies intent and formats the final answer
•	Coordinator – manages the full pipeline and returns a structured JSON response

The frontend shows the progress of each agent and displays the final result.

Tech Stack
•	Node.js + Express
•	Vanilla JavaScript
•	HTML/CSS
•	Wikipedia REST API

How it Works
1.	The user enters a question in the interface.
2.	The server extracts a topic (e.g., “Kubernetes”, “Mahatma Gandhi”).
3.	The Wikipedia API is used to retrieve a short summary.
4.	The text is analyzed into bullet points.
5.	The system decides whether the user wants an overview, comparison, or getting-started style answer.
6.	A clean final response is generated and shown in the UI.

API

POST /api/query
Request:

{ "query": "your question here" }


Response contains the research, analysis, intent, and final text.

Runnning Locally:

npm install

npm start

Then open,

http://localhost:3002


Purpose of the Project

This project demonstrates:
•	Full-stack development
•	Modular backend architecture
•	Working with external APIs
•	Building a clean and functional UI
•	Handling failures and unexpected inputs gracefully