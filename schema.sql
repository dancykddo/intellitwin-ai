-- Database Schema for IntelliTwin Application

CREATE DATABASE IF NOT EXISTS intellitwin;
USE intellitwin;

-- User Profile & Settings
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) DEFAULT 'Alex Student',
    email VARCHAR(255) DEFAULT 'alex@intellitwin.ai',
    study_goal TEXT,
    daily_hours INT DEFAULT 4,
    learning_pace VARCHAR(50) DEFAULT 'Medium',
    difficulty_level VARCHAR(50) DEFAULT 'Intermediate',
    focus_subjects JSON,
    theme VARCHAR(50) DEFAULT 'dark',
    accent_color VARCHAR(50) DEFAULT '#00f2fe',
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Planner Tasks
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    time VARCHAR(50),
    duration VARCHAR(50),
    priority VARCHAR(20),
    category VARCHAR(50),
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Uploaded Files (Knowledge Base)
CREATE TABLE IF NOT EXISTS files (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    size VARCHAR(50),
    date VARCHAR(100),
    category VARCHAR(50),
    status VARCHAR(20) DEFAULT 'Completed',
    progress INT DEFAULT 100,
    url TEXT,
    analysis_json JSON,
    user_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initial Mock Data (Optional, but helps with first run)
INSERT INTO settings (id, name, email, study_goal, focus_subjects) 
SELECT 1, 'Alex Student', 'alex@intellitwin.ai', 'Master Computer Science fundamentals', '["Data Structures", "Algorithms", "OS"]'
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE id = 1);

INSERT INTO tasks (id, title, time, duration, priority, category, completed)
VALUES 
('1', 'Study Data Structures - Trees', '10:00 AM', '2 hours', 'High', 'Today', FALSE),
('2', 'Java Assignment 3 - Multithreading', '01:00 PM', '1.5 hours', 'Medium', 'Today', FALSE),
('3', 'DBMS Normalization Review', '03:30 PM', '1 hour', 'High', 'Upcoming', FALSE);
