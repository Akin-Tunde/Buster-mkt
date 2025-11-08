# Buster-mkt: Onchain Prediction Market Platform

> Buster-mkt is a decentralized, open-source prediction market platform. Users can create, trade, and resolve markets onchain, powered by Next.js, viem, wagmi, and Satori. The platform features advanced analytics, Farcaster mini-app integration, and a focus on transparency and security.
---
## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Smart Contracts](#smart-contracts)
- [Security Notes](#security-notes)
- [Usage](#usage)
- [Development](#development)
- [FAQ](#faq)
- [Contributing](#contributing)
- [License](#license)

---

## Introduction

Buster-mkt enables anyone to participate in decentralized prediction markets. Users can bet on outcomes using ERC20 tokens, view real-time analytics, and share their stats with Satori-generated images. The platform is designed for extensibility, security, and seamless integration with Farcaster and other social protocols.

## Features

- **Onchain Markets:** Create, trade, and resolve prediction markets transparently on the blockchain.
- **ERC20 Token Betting:** All bets and payouts use a standard ERC20 token.
- **Admin Tools:** Comprehensive admin dashboard for market management, withdrawals, role management, and validation.
- **User Analytics:** Track your performance, net winnings, and leaderboard position.
- **Satori Image Generation:** Instantly share your stats as beautiful images.
- **Farcaster Mini-app:** Share and interact with markets directly from Farcaster frames.
- **Secure Faucet/Claim:** New users can claim tokens (if available) to get started.
- **Open Source:** MIT-licensed and open for contributions.

## Architecture

- **Frontend:** Built with Next.js 15, React, Tailwind CSS, and TypeScript.
- **Blockchain:** Uses viem and wagmi for contract interaction; all market logic is onchain.
- **Image Generation:** Satori and sharp for dynamic SVG/PNG stats images.
- **API:** Next.js API routes for server-side logic, analytics, and image endpoints.
- **Farcaster Integration:** Mini-app and frame support for social sharing and engagement.

## Getting Started

1. **Install dependencies:**

   ```bash
   npm install
   # or
   yarn install
   ```

2. **Configure environment:**

   - Copy `.env.example` to `.env.local` and set your environment variables:
     - `NEXT_PUBLIC_ALCHEMY_RPC_URL` (RPC endpoint)
     - Contract addresses (market, token, faucet)
     - Any analytics or third-party keys

3. **Run the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

- `src/app/` — Next.js app directory (API routes, pages, layout)
- `src/components/` — UI and logic components
- `src/constants/` — Contract addresses and ABIs
- `src/lib/` — Analytics, subgraph, and utility functions
- `public/` — Static assets and fonts

## Smart Contracts

- **Market Contract:** Handles market creation, trading, and resolution.
- **ERC20 Token Contract:** Used for all bets and rewards.
- **Faucet/Claim Contract:** (Recommended) For distributing tokens to new users. If the faucet is drained or exploited, deploy a new claim contract and update the frontend.

### Security Best Practices

- Only claim tokens from trusted faucet contracts.
- Each user/address can claim once (or per cooldown period, if enabled).
- Use anti-bot and Sybil resistance measures for public faucets.
- Review contract code and audit before deploying to mainnet.

## Usage

1. **Create a Market:**
   - Navigate to the "Create Market" page and enter your question and options.
2. **Place a Bet:**
   - Select a market, choose your option, and enter your bet amount.
3. **Claim Winnings:**
   - After market resolution, claim your winnings from the UI.
4. **Share Stats:**
   - Use the share button to generate and share your stats image.
5. **Faucet:**
   - If available, claim free tokens to get started.

## Development

- **Contracts:**
  - Solidity contracts are in the `/contracts` directory (if present).
  - Use Hardhat or Foundry for local testing and deployment.
- **Frontend:**
  - Next.js app in `/src/app`.
  - Components in `/src/components`.
- **Testing:**
  - Add unit and integration tests for both contracts and frontend.
- **Linting & Formatting:**
  - Run `npm run lint` and `npm run format` before submitting PRs.

## FAQ

**Q: What if the faucet is empty or exploited?**
A: Deploy a new faucet contract, fund it, and update the frontend integration.

**Q: How do I add a new market?**
A: Use the "Create Market" page in the app. Only authorized users may be able to create markets, depending on contract settings.

**Q: How do I prevent bots from draining the faucet?**
A: Use cooldowns, allowlists, CAPTCHAs, or Sybil resistance tools. See Security Notes above.

**Q: Can I contribute?**
A: Yes! See the section below.

## Contributing
Pull requests and issues are welcome! Please open an issue to discuss major changes. For new features, open a discussion first.

## License

MIT — see [LICENSE](LICENSE) for details.
