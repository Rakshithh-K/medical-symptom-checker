import { useEffect, useRef, useState } from "react";

import SymptomSelector from "../components/SymptomSelector";
import PredictionResults from "../components/PredictionResults";

import {
    getSymptoms,
    createSymptomCheck,
    generateAIExplanation
} from "../services/api";

function Home() {
    const [symptoms, setSymptoms] = useState([]);
    const [selectedSymptoms, setSelectedSymptoms] = useState([]);
    const [predictions, setPredictions] = useState([]);

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState("");

    // AI assistant states
    const [aiExplanation, setAiExplanation] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState("");

    // Follow-up question answers
    const [followUpAnswers, setFollowUpAnswers] = useState({});

    const hasPredicted = useRef(false);
    const requestId = useRef(0);
    const aiRequestId = useRef(0);

    const resultsRef = useRef(null);

    // Fetch available symptoms
    useEffect(() => {
        const fetchSymptoms = async () => {
            try {
                const response = await getSymptoms();
                setSymptoms(response.symptoms);
            } catch (error) {
                setError("Unable to load symptoms. Please try again.");
            } finally {
                setFetching(false);
            }
        };

        fetchSymptoms();
    }, []);

    // Generate ML predictions
    const generatePredictions = async (symptomList, currentRequest) => {
        try {
            setLoading(true);
            setError("");

            // Clear previous AI explanation and answers
            aiRequestId.current++;
            setAiExplanation(null);
            setAiError("");
            setFollowUpAnswers({});

            const response = await createSymptomCheck(symptomList);

            if (currentRequest !== requestId.current) return;

            setPredictions(response.data.predictions);

        } catch (error) {
            if (currentRequest !== requestId.current) return;

            setError(
                error.response?.data?.message ||
                "Unable to generate predictions."
            );
        } finally {
            if (currentRequest === requestId.current) {
                setLoading(false);
            }
        }
    };

    // First prediction
    const handlePredict = () => {
        if (selectedSymptoms.length === 0) {
            setError("Please select at least one symptom.");
            return;
        }

        hasPredicted.current = true;

        const currentRequest = ++requestId.current;

        generatePredictions(selectedSymptoms, currentRequest);
    };

    // Automatically update predictions when symptoms change
    useEffect(() => {
        if (!hasPredicted.current) return;

        if (selectedSymptoms.length === 0) {
            requestId.current++;
            aiRequestId.current++;

            setPredictions([]);
            setAiExplanation(null);
            setAiError("");
            setFollowUpAnswers({});
            setLoading(false);
            setAiLoading(false);
            setError("");

            return;
        }

        const currentRequest = ++requestId.current;

        const timer = setTimeout(() => {
            generatePredictions(selectedSymptoms, currentRequest);
        }, 400);

        return () => clearTimeout(timer);

    }, [selectedSymptoms]);

    // Scroll to updated predictions
    useEffect(() => {
        if (predictions.length > 0) {
            resultsRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    }, [predictions]);

    // Generate AI explanation
    const handleGenerateExplanation = async () => {
        if (selectedSymptoms.length === 0 || predictions.length === 0) {
            setAiError(
                "Generate predictions before requesting an explanation."
            );
            return;
        }

        const currentRequest = ++aiRequestId.current;

        try {
            setAiLoading(true);
            setAiError("");
            setAiExplanation(null);
            setFollowUpAnswers({});

            const response = await generateAIExplanation(
                selectedSymptoms,
                predictions
            );

            if (currentRequest !== aiRequestId.current) return;

            setAiExplanation(response.data);

        } catch (error) {
            if (currentRequest !== aiRequestId.current) return;

            setAiError(
                error.response?.data?.message ||
                "Unable to generate the explanation. Please try again."
            );
        } finally {
            if (currentRequest === aiRequestId.current) {
                setAiLoading(false);
            }
        }
    };

    // Handle Yes/No answers
    const handleFollowUpAnswer = (index, answer) => {
        setFollowUpAnswers((previous) => ({
            ...previous,
            [index]: answer
        }));
    };

    const explanation = aiExplanation?.explanation;

    return (
        <main className="home-container">

            <section className="hero-section">
                <h1>Medical Symptom Checker</h1>

                <p>
                    Select your symptoms and explore possible
                    health conditions using machine learning.
                </p>
            </section>

            {fetching ? (
                <p>Loading symptoms...</p>
            ) : (
                <SymptomSelector
                    symptoms={symptoms}
                    selectedSymptoms={selectedSymptoms}
                    setSelectedSymptoms={setSelectedSymptoms}
                />
            )}

            {selectedSymptoms.length > 0 && (
                <section className="selected-section">
                    <h3>Selected Symptoms</h3>

                    <div className="selected-tags">
                        {selectedSymptoms.map((symptom) => (
                            <button
                                key={symptom}
                                onClick={() =>
                                    setSelectedSymptoms((previous) =>
                                        previous.filter(
                                            (item) => item !== symptom
                                        )
                                    )
                                }
                            >
                                {symptom.replaceAll("_", " ")} ×
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {/* Fixed prediction action bar */}
            {selectedSymptoms.length > 0 && (
                <div className="predict-action-bar">

                    <div className="action-info">
                        <strong>
                            {selectedSymptoms.length} symptoms selected
                        </strong>

                        <span>
                            Ready to check possible conditions
                        </span>
                    </div>

                    <button
                        className="predict-button"
                        onClick={handlePredict}
                        disabled={loading || fetching}
                    >
                        {loading
                            ? "Analyzing..."
                            : hasPredicted.current
                                ? "Refresh Predictions"
                                : "Check Possible Conditions"}
                    </button>

                </div>
            )}

            {loading && (
                <p className="loading-message">
                    Updating predictions...
                </p>
            )}

            {error && (
                <p className="error-message">{error}</p>
            )}

            <div ref={resultsRef}>
                <PredictionResults
                    predictions={predictions}
                />
            </div>

            {/* AI Health Assistant */}
            {predictions.length > 0 && !loading && (
                <section className="ai-assistant-section">

                    <div className="ai-assistant-header">
                        <h2>AI Health Assistant</h2>

                        <p>
                            Get an explanation of your selected symptoms
                            and possible conditions.
                        </p>
                    </div>

                    <button
                        className="ai-explain-button"
                        onClick={handleGenerateExplanation}
                        disabled={aiLoading}
                    >
                        {aiLoading
                            ? "Generating Explanation..."
                            : aiExplanation
                                ? "Regenerate Explanation"
                                : "Generate AI Explanation"}
                    </button>

                    {aiError && (
                        <p className="error-message">
                            {aiError}
                        </p>
                    )}

                    {aiLoading && (
                        <p className="loading-message">
                            Preparing your health explanation...
                        </p>
                    )}

                    {aiExplanation && explanation && (
                        <div className="ai-explanation-results">

                            <div className="ai-provider-status">
                                <strong>
                                    Generated by: {aiExplanation.provider}
                                </strong>

                                <span>
                                    {aiExplanation.fallbackUsed
                                        ? "Fallback provider used"
                                        : "Selected provider used"}
                                </span>
                            </div>

                            {/* Summary and symptom analysis */}
                            <div className="ai-explanation-card">

                                <h3>Summary</h3>
                                <p>{explanation.summary}</p>

                                <h3>Symptom Analysis</h3>
                                <p>{explanation.symptomAnalysis}</p>

                            </div>

                            {/* Possible conditions */}
                            <div className="ai-explanation-card">

                                <h3>Possible Reasons</h3>

                                {explanation.possibleReasons?.map(
                                    (item, index) => (
                                        <div
                                            className="ai-condition"
                                            key={`${item.disease}-${index}`}
                                        >
                                            <h4>{item.disease}</h4>

                                            {item.explanation && (
                                                <p>{item.explanation}</p>
                                            )}

                                            {item.description && (
                                                <p>{item.description}</p>
                                            )}

                                            {item.relatedSymptoms?.length > 0 && (
                                                <div>
                                                    <strong>
                                                        Related symptoms:
                                                    </strong>

                                                    <ul>
                                                        {item.relatedSymptoms.map(
                                                            (symptom, symptomIndex) => (
                                                                <li key={symptomIndex}>
                                                                    {symptom.replaceAll("_", " ")}
                                                                </li>
                                                            )
                                                        )}
                                                    </ul>
                                                </div>
                                            )}

                                            {item.precautions?.length > 0 && (
                                                <div>
                                                    <strong>
                                                        Dataset precautions:
                                                    </strong>

                                                    <ul>
                                                        {item.precautions.map(
                                                            (precaution, precautionIndex) => (
                                                                <li key={precautionIndex}>
                                                                    {precaution}
                                                                </li>
                                                            )
                                                        )}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )
                                )}

                            </div>

                            {/* Follow-up questions with pre-generated answers */}
                            {explanation.additionalQuestions?.length > 0 && (
                                <div className="ai-explanation-card">

                                    <h3>Additional Questions</h3>

                                    <p>
                                        Answer these questions to understand
                                        how different responses relate to
                                        your symptoms.
                                    </p>

                                    {explanation.additionalQuestions.map(
                                        (item, index) => {

                                            // Supports the old string format
                                            // if an older AI response is returned.
                                            if (typeof item === "string") {
                                                return (
                                                    <div
                                                        className="ai-condition"
                                                        key={index}
                                                    >
                                                        <h4>
                                                            {index + 1}. {item}
                                                        </h4>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div
                                                    className="ai-condition follow-up-question"
                                                    key={index}
                                                >

                                                    <h4>
                                                        {index + 1}. {item.question}
                                                    </h4>

                                                    <div className="follow-up-buttons">

                                                        <button
                                                            type="button"
                                                            className={
                                                                followUpAnswers[index] === "Yes"
                                                                    ? "follow-up-selected"
                                                                    : ""
                                                            }
                                                            onClick={() =>
                                                                handleFollowUpAnswer(
                                                                    index,
                                                                    "Yes"
                                                                )
                                                            }
                                                        >
                                                            Yes
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className={
                                                                followUpAnswers[index] === "No"
                                                                    ? "follow-up-selected"
                                                                    : ""
                                                            }
                                                            onClick={() =>
                                                                handleFollowUpAnswer(
                                                                    index,
                                                                    "No"
                                                                )
                                                            }
                                                        >
                                                            No
                                                        </button>

                                                    </div>

                                                    {followUpAnswers[index] && (
                                                        <div className="follow-up-explanation">

                                                            <strong>
                                                                Your answer: {followUpAnswers[index]}
                                                            </strong>

                                                            <p>
                                                                {followUpAnswers[index] === "Yes"
                                                                    ? item.yesExplanation
                                                                    : item.noExplanation}
                                                            </p>

                                                        </div>
                                                    )}

                                                </div>
                                            );
                                        }
                                    )}

                                </div>
                            )}

                            {/* General advice */}
                            {explanation.generalAdvice?.length > 0 && (
                                <div className="ai-explanation-card">

                                    <h3>General Advice</h3>

                                    <ul>
                                        {explanation.generalAdvice.map(
                                            (advice, index) => (
                                                <li key={index}>
                                                    {advice}
                                                </li>
                                            )
                                        )}
                                    </ul>

                                </div>
                            )}

                            <p className="ai-disclaimer">
                                This information is for educational purposes
                                only. It is not a medical diagnosis. Consult
                                a qualified healthcare professional for
                                medical evaluation.
                            </p>

                        </div>
                    )}

                </section>
            )}

        </main>
    );
}

export default Home;