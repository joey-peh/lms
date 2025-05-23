# Learning Management System (SPA)
[![image-2025-05-23-220746359.png](https://i.postimg.cc/Hkz7Pn57/image-2025-05-23-220746359.png)](https://postimg.cc/18gt89v9)
## Overview
This **Single Page Application (SPA)**, built with **Angular**, provides a Learning Management System (LMS) dashboard and discussions interface. Developed in **one week**, it visualizes course data and manages discussions with role-based permissions. The application is deployed on **GitHub Pages** for easy access and verification.

## Features
- **Dashboard**:
  - Displays **14 charts** and **2 tables** to visualize course data (e.g., enrollment trends) loaded from CSV files.
  - Each chart includes a descriptive annotation to justify its relevance for instructors.
- **Discussions**:
  - Simple UI for viewing and managing discussion topics.
- **Role-based permissions**:
    - **Admin** (Name: `admin`): View all course data and delete any topic or enrollment.
    - **Instructor** (Name: `user_115`, "Web Development" course): View course-specific data and delete own topics.
- Data managed in **Angular state**, with session-based manipulation (non-persistent due to frontend-only design).

## Tech Stack
- **Frontend**: Angular, JavaScript, HTML, CSS
- **Data Visualization**: Chart.js 
- **Data Source**: CSV files
- **Deployment**: GitHub Pages
- **Version Control**: Git

## Setup Instructions
To run the project locally:
1. Clone the repository:
   ```bash
   git clone https://github.com/joey-peh/lms.git
   ```
2. Navigate to the project directory:
   ```bash
   cd lms
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm start
   ```
5. Open `http://localhost:4200` in your browser to view the application.

## Deployment
The application is deployed on GitHub Pages at [https://joey-peh.github.io/lms](https://joey-peh.github.io/lms). Access it using:
- **Admin Account**: LoginID: `admin`, Password: `a123` (full access to all courses and topics).
- **Instructor Account**: LoginID: `o6v7dy55`, Password: `i123` (access to "Web Development" course data only).

## Limitations
- **Frontend-Only**: Data is loaded from CSV files and managed in Angular state, so changes (e.g., deleting topics) reset on page refresh.

## Notes
This project was built in one week, focusing on rapid development and SPA functionality. The use of 14 charts explores diverse visualizations to provide instructor insights, with potential for refinement based on specific data needs.
