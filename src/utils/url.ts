export const getBasePath = () => {
    const publicUrl = process.env.PUBLIC_URL || '';
    if (publicUrl && publicUrl !== '.') {
        const basePath = new URL(publicUrl, window.location.origin).pathname;
        const normalized = basePath.endsWith('/')
            ? basePath.slice(0, -1)
            : basePath;
        if (normalized && normalized !== '/') {
            return normalized;
        }
    }

    const parts = window.location.pathname.split('/').filter(Boolean);
    const tierIndex = parts.findIndex(part =>
        ['foundational', 'associate', 'professional'].includes(part)
    );
    if (tierIndex > 0) {
        return `/${parts.slice(0, tierIndex).join('/')}`;
    }
    if (tierIndex === 0) {
        return '';
    }
    if (parts.length === 1) {
        return `/${parts[0]}`;
    }
    return '';
};

export const getAssetUrl = (assetPath: string) => {
    const normalizedPath = assetPath.startsWith('/')
        ? assetPath
        : `/${assetPath}`;
    const publicUrl = process.env.PUBLIC_URL || '';
    if (publicUrl && publicUrl !== '.') {
        return `${publicUrl}${normalizedPath}`;
    }
    return `${window.location.origin}${getBasePath()}${normalizedPath}`;
};

export const resolveAssetPath = (assetPath?: string | null) => {
    if (!assetPath) return '';
    if (/^(https?:)?\/\//i.test(assetPath)) {
        return assetPath;
    }
    if (assetPath.startsWith('data:')) {
        return assetPath;
    }
    return getAssetUrl(assetPath);
};

export const getRedirectPath = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const redirectParam = urlParams.get('redirect');
    if (!redirectParam) return null;
    const decoded = decodeURIComponent(redirectParam);
    const targetUrl = new URL(decoded, window.location.origin);
    return `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;
};
