import React from 'react';
import {
    QuestionBank,
    CertificationTier,
    CERTIFICATION_TIERS,
    QUESTION_BANKS,
} from '../types';
import {
    Lock,
    Sparkles,
    Brain,
    Cloud,
    Database,
    Code,
    Shield,
    Network,
    Settings,
    Users,
    BookOpen,
} from 'lucide-react';

interface CertificationSelectorProps {
    onSelectBank: (bank: QuestionBank) => void;
}

// Icon mapping for each certification
const getCertificationIcon = (key: string, size: number = 24) => {
    const iconProps = { size, strokeWidth: 1.5 };
    switch (key) {
        case 'cdl':
            return <Cloud {...iconProps} />;
        case 'genai':
            return <Sparkles {...iconProps} />;
        case 'ace':
            return <Cloud {...iconProps} />;
        case 'adp':
            return <Database {...iconProps} />;
        case 'agwa':
            return <Users {...iconProps} />;
        case 'pca':
            return <Cloud {...iconProps} />;
        case 'pcde':
            return <Database {...iconProps} />;
        case 'pcd':
            return <Code {...iconProps} />;
        case 'pde':
            return <Database {...iconProps} />;
        case 'pcdo':
            return <Settings {...iconProps} />;
        case 'pcse':
            return <Shield {...iconProps} />;
        case 'pcne':
            return <Network {...iconProps} />;
        case 'pmle':
            return <Brain {...iconProps} />;
        case 'psoe':
            return <Shield {...iconProps} />;
        default:
            return <BookOpen {...iconProps} />;
    }
};

const CertificationCard: React.FC<{
    bank: QuestionBank;
    onClick: () => void;
}> = ({ bank, onClick }) => {
    return (
        <button
            className={`cert-card ${!bank.available ? 'cert-card-disabled' : ''}`}
            onClick={onClick}
            disabled={!bank.available}
            style={
                {
                    '--cert-color': bank.color,
                } as React.CSSProperties
            }
        >
            <div className="cert-card-icon">
                {getCertificationIcon(bank.key, 28)}
            </div>
            <div className="cert-card-content">
                <h4 className="cert-card-name">{bank.name}</h4>
                <span className="cert-card-badge">{bank.shortName}</span>
            </div>
            {!bank.available && (
                <div className="cert-card-lock">
                    <Lock size={16} />
                    <span>Coming Soon</span>
                </div>
            )}
            {bank.available && (
                <div className="cert-card-available">
                    <span>Start Learning</span>
                </div>
            )}
        </button>
    );
};

const TierColumn: React.FC<{
    tier: CertificationTier;
    banks: QuestionBank[];
    onSelectBank: (bank: QuestionBank) => void;
}> = ({ tier, banks, onSelectBank }) => {
    const tierInfo = CERTIFICATION_TIERS[tier];

    return (
        <div className="tier-column">
            <div
                className="tier-header"
                style={
                    { '--tier-color': tierInfo.color } as React.CSSProperties
                }
            >
                <h3>{tierInfo.name} certification</h3>
                <p>{tierInfo.description}</p>
            </div>
            <div className="tier-role-label">Role</div>
            <div className="tier-cards">
                {banks.map(bank => (
                    <CertificationCard
                        key={bank.key}
                        bank={bank}
                        onClick={() => onSelectBank(bank)}
                    />
                ))}
            </div>
        </div>
    );
};

export const CertificationSelector: React.FC<CertificationSelectorProps> = ({
    onSelectBank,
}) => {
    const tiers: CertificationTier[] = [
        'foundational',
        'associate',
        'professional',
    ];

    const getBanksByTier = (tier: CertificationTier) =>
        QUESTION_BANKS.filter(bank => bank.tier === tier).sort((a, b) => {
            // Available banks come first
            if (a.available && !b.available) return -1;
            if (!a.available && b.available) return 1;
            return 0;
        });

    return (
        <div className="cert-selector">
            <header className="cert-selector-header">
                <div className="google-cloud-logo">
                    <svg viewBox="0 0 48 48" width="40" height="40">
                        <path
                            fill="#4285F4"
                            d="M24 4C12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20S35.05 4 24 4zm-2 35.86c-7.9-.98-14-7.7-14-15.86 0-1.24.16-2.42.42-3.58L18 30v2c0 2.2 1.8 4 4 4v3.86zm13.8-5.08c-.52-1.62-2-2.78-3.8-2.78h-2v-6c0-1.1-.9-2-2-2h-8v-4h4c1.1 0 2-.9 2-2v-4h4c2.2 0 4-1.8 4-4v-.82C41.86 10.38 44 16.12 44 24c0 4.16-1.6 7.94-4.2 10.78z"
                        />
                    </svg>
                    <div className="logo-text">
                        <span className="logo-title">Google Cloud</span>
                        <span className="logo-subtitle">
                            Certification Flashcards
                        </span>
                    </div>
                </div>
                <p className="cert-selector-desc">
                    Validate your skills with Google Cloud certifications.
                    Select a certification below to start studying with
                    interactive flashcards.
                </p>
            </header>

            <h2 className="cert-selector-section-title">
                Which certification is right for you?
            </h2>

            <div className="tier-grid">
                {tiers.map(tier => (
                    <TierColumn
                        key={tier}
                        tier={tier}
                        banks={getBanksByTier(tier)}
                        onSelectBank={onSelectBank}
                    />
                ))}
            </div>

            <footer className="cert-selector-footer">
                <p>
                    Study smarter, not harder. Practice with flashcards designed
                    to help you pass your Google Cloud certification exams.
                </p>
            </footer>
        </div>
    );
};
