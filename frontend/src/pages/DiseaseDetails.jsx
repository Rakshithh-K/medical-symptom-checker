import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getDiseaseByName } from "../services/api";

function DiseaseDetails() {

    const { name } = useParams();

    const [disease, setDisease] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {

        const fetchDisease = async () => {

            try {
                setLoading(true);
                setError("");

                const response = await getDiseaseByName(name);

                setDisease(response.data);

            } catch (error) {
                setError(
                    error.response?.data?.message ||
                    "Unable to load disease details."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchDisease();

    }, [name]);

    const formatText = (text) => {
        return text.replaceAll("_", " ");
    };

    if (loading) {
        return (
            <main className="disease-page">
                <p className="disease-status">
                    Loading disease details...
                </p>
            </main>
        );
    }

    if (error || !disease) {
        return (
            <main className="disease-page">
                <p className="error-message">
                    {error || "Disease not found"}
                </p>

                <Link to="/diseases">
                    Back to Diseases
                </Link>
            </main>
        );
    }

    return (

        <main className="disease-page">

            <Link
                to="/diseases"
                className="back-link"
            >
                ← Back to Diseases
            </Link>

            <section className="disease-detail-card">

                <h1>{disease.disease}</h1>

                <div className="detail-section">

                    <h2>Description</h2>

                    <p>{disease.description}</p>

                </div>

                <div className="detail-section">

                    <h2>Associated Symptoms</h2>

                    <div className="disease-tags">

                        {disease.symptoms.map((symptom) => (

                            <span key={symptom}>
                                {formatText(symptom)}
                            </span>

                        ))}

                    </div>

                </div>

                <div className="detail-section">

                    <h2>Precautions</h2>

                    <ul className="precaution-list">

                        {disease.precautions.map((precaution, index) => (

                            <li key={index}>
                                {precaution}
                            </li>

                        ))}

                    </ul>

                </div>

            </section>

        </main>
    );
}

export default DiseaseDetails;