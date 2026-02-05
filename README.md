# Google Cloud Certification Flashcards

A React-based flashcard application for studying Google Cloud certifications. This app provides multiple study modes with intelligent performance tracking and spaced repetition.

## Features

### 🎯 Study Modes

- **Flashcard Mode**: Traditional flashcard experience - see the question, reveal the answer
- **Quiz Mode**: Multiple choice questions with immediate feedback
- **Review Mode**: Focus on questions you got wrong or haven't answered yet
- **Memorise Mode**: Browse all questions and answers with performance statistics
- **Fill in the Blank Mode**: Fill in the blanks in the answer

### 📊 Smart Learning

- **Performance Tracking**: Tracks correct/incorrect answers for each question
- **Spaced Repetition**: Wrong answers are scheduled to reappear within 4-10 questions
- **Weighted Shuffling**: Prioritizes incorrect and unseen questions
- **Progress Analytics**: View your overall progress and accuracy

### 🎨 Modern UI

- Clean, responsive design
- Smooth animations and transitions
- Mobile-friendly interface

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository or download the files
2. Install dependencies:

   ```bash
   npm install
   ```

### Running the App

Start the development server:

```bash
npm start
```

The app will open in your browser at `http://localhost:3000`.

### Building for Production

To create a production build:

```bash
npm run build
```

## Usage

### Starting a Study Session

1. **Choose Your Mode**: Select from the four available study modes on the home screen
2. **Answer Questions**:
   - In Flashcard mode: Click "Reveal Answer", then mark if you got it right or wrong
   - In Quiz mode: Select an answer, then click "Reveal Answer" to see if you were correct
3. **Track Progress**: Your performance is automatically saved and tracked

### Performance Tracking

- **Green checkmarks**: Correct answers
- **Red X marks**: Incorrect answers
- **Accuracy percentage**: Overall performance across all questions
- **Review counter**: Number of questions needing review

### Data Persistence

All your progress is automatically saved to your browser's local storage, so you can pick up where you left off.

## Technical Features

### Intelligent Scheduling

- Questions answered incorrectly are automatically rescheduled to appear again within 4-10 questions
- The app uses weighted shuffling to prioritize questions that need more practice
- Review mode only shows questions you got wrong or haven't attempted

### Performance Analytics

- Tracks total attempts, correct answers, and accuracy for each question
- Provides overall statistics including total questions answered and accuracy rate
- Visual progress indicators show your learning progress

### Responsive Design

- Works on desktop, tablet, and mobile devices
- Touch-friendly interface for mobile users
- Adaptive layout that adjusts to screen size

## Dataset

The app includes a comprehensive dataset of PMLE exam questions covering:

- Machine Learning fundamentals
- Google Cloud Platform services
- Vertex AI and AutoML
- Model deployment and monitoring
- Data preprocessing and feature engineering
- ML operations and best practices

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is for educational purposes only.

## Tips for Effective Study

1. **Use Review Mode**: Focus on questions you got wrong to improve weak areas
2. **Mix Modes**: Alternate between flashcard and quiz modes for variety
3. **Regular Practice**: Study regularly rather than cramming
4. **Track Progress**: Monitor your accuracy and focus on improving
5. **Use Memorise Mode**: Browse questions to get familiar with the format

## Troubleshooting

### Common Issues

**App doesn't start**: Make sure you have Node.js installed and run `npm install`

**Questions not loading**: The questions are embedded in the app code, no external API required

**Progress not saving**: Check if your browser allows local storage

**Performance issues**: Try clearing your browser cache or using a different browser

---

Happy studying! 🎓
