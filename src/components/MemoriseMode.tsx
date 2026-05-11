import React, { useState, useEffect } from 'react';
import { Question, QuestionPerformance } from '../types';
import {
    TrendingUp,
    TrendingDown,
    Eye,
    Search,
    Filter,
    HelpCircle,
    CheckCircle,
    XCircle,
    Calendar,
    BarChart3,
    ListChecks,
} from 'lucide-react';
import { formatText } from '../utils/textFormatting';

// Helper function to check if explanation has meaningful content
const hasExplanation = (explanation: string): boolean => {
    return explanation.trim().replace(/\n/g, '').length > 0;
};

interface MemoriseModeProps {
    questions: Question[];
    performance: Map<string, QuestionPerformance>;
}

export const MemoriseMode: React.FC<MemoriseModeProps> = ({
    questions,
    performance,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showAnswers, setShowAnswers] = useState(true);
    const [revealedAnswers, setRevealedAnswers] = useState<Set<string>>(
        () => new Set()
    );
    const [sortBy, setSortBy] = useState<'index' | 'performance' | 'accuracy'>(
        'index'
    );

    const toggleShowAnswers = (nextValue: boolean) => {
        setShowAnswers(nextValue);
        if (!nextValue) {
            setRevealedAnswers(new Set());
        }
    };

    // Add keyboard event listeners
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            // Prevent keyboard shortcuts when user is typing in an input
            if (
                event.target instanceof HTMLInputElement ||
                event.target instanceof HTMLTextAreaElement
            ) {
                return;
            }

            switch (event.key) {
                case 'h':
                case 'H':
                    event.preventDefault();
                    toggleShowAnswers(!showAnswers);
                    break;
                case '/':
                    event.preventDefault();
                    (
                        document.querySelector(
                            '.search-input'
                        ) as HTMLInputElement
                    )?.focus();
                    break;
                case 'Escape':
                    event.preventDefault();
                    setSearchTerm('');
                    (
                        document.querySelector(
                            '.search-input'
                        ) as HTMLInputElement
                    )?.blur();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [showAnswers]);

    const filteredQuestions = questions.filter(
        q =>
            formatText(q.question)
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            formatText(q.answer.join(', '))
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            formatText(q.explanation)
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
    );

    const sortedQuestions = [...filteredQuestions].sort((a, b) => {
        const perfA = performance.get(a.id);
        const perfB = performance.get(b.id);

        switch (sortBy) {
            case 'performance':
                const totalA =
                    (perfA?.correctCount || 0) + (perfA?.incorrectCount || 0);
                const totalB =
                    (perfB?.correctCount || 0) + (perfB?.incorrectCount || 0);
                return totalB - totalA;
            case 'accuracy':
                const accuracyA = perfA
                    ? perfA.correctCount /
                          (perfA.correctCount + perfA.incorrectCount) || 0
                    : 0;
                const accuracyB = perfB
                    ? perfB.correctCount /
                          (perfB.correctCount + perfB.incorrectCount) || 0
                    : 0;
                return accuracyB - accuracyA;
            default:
                return 0;
        }
    });

    const getAccuracy = (perf: QuestionPerformance | undefined) => {
        if (!perf || perf.correctCount + perf.incorrectCount === 0) return 0;
        return (
            (perf.correctCount / (perf.correctCount + perf.incorrectCount)) *
            100
        );
    };

    const getPerformanceColor = (perf: QuestionPerformance | undefined) => {
        const accuracy = getAccuracy(perf);
        if (accuracy >= 80) return 'performance-excellent';
        if (accuracy >= 60) return 'performance-good';
        if (accuracy >= 40) return 'performance-fair';
        return 'performance-poor';
    };

    return (
        <div className="memorise-container">
            <div className="memorise-controls">
                <div className="search-container">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search questions, answers, or explanations... (Press / to focus)"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="view-controls">
                    <label
                        className="checkbox-toggle"
                        title="Toggle answers (H)"
                    >
                        <input
                            type="checkbox"
                            checked={showAnswers}
                            onChange={event =>
                                toggleShowAnswers(event.target.checked)
                            }
                        />
                        <span className="checkbox-label">Show Answers</span>
                    </label>

                    <div className="sort-container">
                        <Filter size={16} />
                        <select
                            value={sortBy}
                            onChange={e =>
                                setSortBy(
                                    e.target.value as
                                        | 'index'
                                        | 'performance'
                                        | 'accuracy'
                                )
                            }
                            className="sort-select"
                        >
                            <option value="index">Original Order</option>
                            <option value="performance">Most Attempted</option>
                            <option value="accuracy">Highest Accuracy</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="questions-list">
                <div
                    className="navigation-controls"
                    style={{ marginBottom: '1rem' }}
                >
                    <span className="question-counter">
                        Showing {sortedQuestions.length} of {questions.length}{' '}
                        questions
                    </span>
                </div>
                {sortedQuestions.map((question, index) => {
                    const perf = performance.get(question.id);
                    const accuracy = getAccuracy(perf);
                    const performanceClass = getPerformanceColor(perf);

                    return (
                        <div key={question.id} className="memorise-card">
                            <div className="card-header">
                                <div className="question-number">
                                    <HelpCircle size={16} />
                                    Question {questions.indexOf(question) + 1}
                                </div>
                                <div
                                    className={`performance-badge ${performanceClass}`}
                                >
                                    {perf ? (
                                        <div className="performance-stats">
                                            <BarChart3 size={14} />
                                            <span className="accuracy">
                                                {accuracy.toFixed(0)}%
                                            </span>
                                            <span className="attempts">
                                                {perf.correctCount +
                                                    perf.incorrectCount}{' '}
                                                attempts
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="not-attempted">
                                            <XCircle size={14} />
                                            Not attempted
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="card-content">
                                <div className="question-section">
                                    <h3>
                                        <HelpCircle size={18} />
                                        Question
                                    </h3>
                                    {question.questionImages?.length ? (
                                        <div className="question-images">
                                            {question.questionImages.map(
                                                (image, index) => (
                                                    <img
                                                        key={`${question.id}-qimg-${index}`}
                                                        src={image}
                                                        alt=""
                                                        className="question-image"
                                                    />
                                                )
                                            )}
                                        </div>
                                    ) : null}
                                    <p className="question-text">
                                        {formatText(question.question)}
                                    </p>
                                </div>

                                <div className="options-section">
                                    <h4>
                                        <ListChecks size={16} />
                                        Options
                                    </h4>
                                    <div className="options-list">
                                        {question.options.map(
                                            (option, optionIndex) => (
                                                <div
                                                    key={optionIndex}
                                                    className="option-item"
                                                >
                                                    <span className="option-letter">
                                                        {String.fromCharCode(
                                                            65 + optionIndex
                                                        )}
                                                    </span>
                                                    <span className="option-text">
                                                        {formatText(option)}
                                                    </span>
                                                    {question.optionImages?.[
                                                        optionIndex
                                                    ] ? (
                                                        <img
                                                            src={
                                                                question
                                                                    .optionImages[
                                                                    optionIndex
                                                                ] || ''
                                                            }
                                                            alt=""
                                                            className="option-image"
                                                        />
                                                    ) : null}
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>

                                {!showAnswers &&
                                    !revealedAnswers.has(question.id) && (
                                        <button
                                            className="btn btn-secondary"
                                            onClick={() =>
                                                setRevealedAnswers(
                                                    prevAnswers =>
                                                        new Set(
                                                            prevAnswers
                                                        ).add(question.id)
                                                )
                                            }
                                        >
                                            Show answer
                                        </button>
                                    )}

                                {(showAnswers ||
                                    revealedAnswers.has(question.id)) && (
                                    <div className="answer-section">
                                        <h4>
                                            <CheckCircle size={16} />
                                            Answer & Explanation
                                        </h4>
                                        <p className="answer-text">
                                            <strong>
                                                Correct Answer:{' '}
                                                {formatText(
                                                    question.answer.join(', ')
                                                )}
                                            </strong>
                                        </p>
                                        {hasExplanation(
                                            question.explanation
                                        ) && (
                                            <div className="explanation">
                                                <p>
                                                    {formatText(
                                                        question.explanation
                                                    )}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="card-footer">
                                <div className="performance-details">
                                    {perf && (
                                        <div className="performance-breakdown">
                                            <div className="correct-stat">
                                                <TrendingUp
                                                    size={16}
                                                    className="icon-correct"
                                                />
                                                <span>
                                                    Correct: {perf.correctCount}
                                                </span>
                                            </div>
                                            <div className="incorrect-stat">
                                                <TrendingDown
                                                    size={16}
                                                    className="icon-incorrect"
                                                />
                                                <span>
                                                    Incorrect:{' '}
                                                    {perf.incorrectCount}
                                                </span>
                                            </div>
                                            {perf.lastAnswered && (
                                                <div className="last-answered">
                                                    <Calendar size={14} />
                                                    Last answered:{' '}
                                                    {perf.lastAnswered.toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {sortedQuestions.length === 0 && (
                <div className="no-results">
                    <Search size={48} style={{ opacity: 0.5 }} />
                    <p>No questions found matching your search.</p>
                </div>
            )}

            <div className="memorise-footer">
                <p>
                    <BarChart3 size={16} />
                    Total Questions: {questions.length}
                </p>
                <p>
                    <Eye size={16} />
                    Showing: {sortedQuestions.length}
                </p>
            </div>
        </div>
    );
};
