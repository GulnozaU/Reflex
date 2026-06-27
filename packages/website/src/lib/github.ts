export const GITHUB_REPO = 'GulnozaU/Reflex';
export const GITHUB_URL = `https://github.com/${GITHUB_REPO}`;
export const GITHUB_RELEASES = `${GITHUB_URL}/releases/latest`;
export const DOCS_URL = `${GITHUB_URL}#install`;

/** Production site — VSIX is hosted here (GitHub Releases often blocks .vsix uploads). */
export const SITE_URL = 'https://reflex-virid.vercel.app';

export const VSIX_VERSION = '0.1.0';
export const VSIX_FILENAME = `reflex-${VSIX_VERSION}.vsix`;
export const VSIX_DOWNLOAD_URL = `${SITE_URL}/${VSIX_FILENAME}`;
export const VSIX_GITHUB_URL = `${GITHUB_URL}/releases/download/v${VSIX_VERSION}/${VSIX_FILENAME}`;
