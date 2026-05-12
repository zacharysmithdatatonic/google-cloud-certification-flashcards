import React from 'react';
import { Box, Container, Typography, Stack, Button } from '@mui/material';
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

const CertificationItem: React.FC<{
    bank: QuestionBank;
    onClick: () => void;
}> = ({ bank, onClick }) => {
    return (
        <Button
            onClick={onClick}
            disabled={!bank.available}
            variant="text"
            sx={{
                justifyContent: 'flex-start',
                textTransform: 'none',
                padding: '0.35rem 0',
                minHeight: 32,
                overflow: 'hidden',
                alignItems: 'center',
                color: bank.available ? 'text.primary' : 'text.disabled',
                '& .MuiButton-startIcon': {
                    marginLeft: 1,
                    marginRight: 1,
                },
            }}
            startIcon={
                <Box
                    sx={{
                        color: bank.available ? bank.color : 'text.disabled',
                    }}
                >
                    {getCertificationIcon(bank.key, 18)}
                </Box>
            }
        >
            <Stack spacing={0.25} sx={{ alignItems: 'flex-start' }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {bank.name}
                </Typography>
                {!bank.available && (
                    <Typography variant="caption" color="text.secondary">
                        <Lock size={12} /> Coming soon
                    </Typography>
                )}
            </Stack>
        </Button>
    );
};

const TierColumn: React.FC<{
    tier: CertificationTier;
    banks: QuestionBank[];
    onSelectBank: (bank: QuestionBank) => void;
}> = ({ tier, banks, onSelectBank }) => {
    const tierInfo = CERTIFICATION_TIERS[tier];

    return (
        <Box
            sx={{
                borderLeft: '4px solid',
                borderColor: tierInfo.color,
                pl: 2,
                py: 1,
            }}
        >
            <Stack spacing={1.5}>
                <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        {tierInfo.name} certification
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {tierInfo.description}
                    </Typography>
                </Box>
                <Typography variant="overline" color="text.secondary">
                    Role
                </Typography>
                <Stack spacing={0.5}>
                    {banks.map(bank => (
                        <CertificationItem
                            key={bank.key}
                            bank={bank}
                            onClick={() => onSelectBank(bank)}
                        />
                    ))}
                </Stack>
            </Stack>
        </Box>
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
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 6 }}>
            <Container maxWidth="lg">
                <Stack spacing={4}>
                    <Stack spacing={2} sx={{ alignItems: 'center' }}>
                        <Stack
                            direction="row"
                            spacing={2}
                            sx={{ alignItems: 'center' }}
                        >
                            <svg viewBox="0 0 48 48" width="40" height="40">
                                <path
                                    fill="#4285F4"
                                    d="M24 4C12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20S35.05 4 24 4zm-2 35.86c-7.9-.98-14-7.7-14-15.86 0-1.24.16-2.42.42-3.58L18 30v2c0 2.2 1.8 4 4 4v3.86zm13.8-5.08c-.52-1.62-2-2.78-3.8-2.78h-2v-6c0-1.1-.9-2-2-2h-8v-4h4c1.1 0 2-.9 2-2v-4h4c2.2 0 4-1.8 4-4v-.82C41.86 10.38 44 16.12 44 24c0 4.16-1.6 7.94-4.2 10.78z"
                                />
                            </svg>
                            <Box>
                                <Typography variant="h4">
                                    Google Cloud
                                </Typography>
                                <Typography variant="h5" color="text.secondary">
                                    Certification Flashcards
                                </Typography>
                            </Box>
                        </Stack>
                        <Typography
                            variant="body1"
                            color="text.secondary"
                            sx={{ textAlign: 'center', maxWidth: 700 }}
                        >
                            Choose your certification track to start studying
                            with focused flashcards tailored to the exam.
                        </Typography>
                    </Stack>

                    <Box
                        sx={{
                            display: 'grid',
                            gap: 3,
                            gridTemplateColumns: {
                                xs: '1fr',
                                md: 'repeat(3, 1fr)',
                            },
                        }}
                    >
                        {tiers.map(tier => (
                            <TierColumn
                                key={tier}
                                tier={tier}
                                banks={getBanksByTier(tier)}
                                onSelectBank={onSelectBank}
                            />
                        ))}
                    </Box>
                </Stack>
            </Container>
        </Box>
    );
};
