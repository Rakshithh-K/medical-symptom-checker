import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDiseases } from "../services/api";

function ExploreDiseases() {

    const [diseases, setDiseases] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {

        const timer = setTimeout(async () => {

            try {
                setLoading(true);
                setError("");

                const response = await getDiseases(search);

                setDiseases(response.data);

            } catch (error) {
                setError("Unable to load diseases. Please try again.");
            } finally {
                setLoading(false);
            }

        }, 300);

        return () => clearTimeout(timer);

    }, [search]);

    const formatText = (text) => {
        return text.replaceAll("_", " ");
    };

    return (
        <main className="disease-page">

            <section className="disease-hero">
                <h1>Explore Diseases</h1>

                <p>
                    Explore diseases, their common symptoms,
                    descriptions and precautions.
                </p>
            </section>

            <section className="disease-search-section">

                <input
                    type="text"
                    placeholder="Search diseases..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="disease-search"
                />

                <p className="disease-count">
                    {diseases.length} diseases found
                </p>

            </section>

            {loading ? (

                <p className="disease-status">
                    Loading diseases...
                </p>

            ) : error ? (

                <p className="error-message">{error}</p>

            ) : diseases.length === 0 ? (

                <p className="disease-status">
                    No diseases found.
                </p>

            ) : (

                <section className="disease-grid">

                    {diseases.map((item) => (

                        <article
                            className="disease-card"
                            key={item.disease}
                        >

                            <h3>{item.disease}</h3>

                            <p className="disease-description">
                                {item.description.length > 150
                                    ? item.description.slice(0, 150) + "..."
                                    : item.description}
                            </p>

                            <h4>Common Symptoms</h4>

                            <div className="disease-tags">

                                {item.symptoms.slice(0, 4).map((symptom) => (
                                    <span key={symptom}>
                                        {formatText(symptom)}
                                    </span>
                                ))}

                                {item.symptoms.length > 4 && (
                                    <span>
                                        +{item.symptoms.length - 4} more
                                    </span>
                                )}

                            </div>

                            <Link
                                to={`/diseases/${encodeURIComponent(item.disease)}`}
                                className="disease-details-button"
                            >
                                View Details →
                            </Link>

                        </article>

                    ))}

                </section>

            )}

        </main>
    );
}

export default ExploreDiseases;