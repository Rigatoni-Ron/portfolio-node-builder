// Curated catalog of popular assets for the ticker picker.
// Not exhaustive — the picker also allows free-form entry for anything else.

export type TickerType = 'ETF' | 'Stock' | 'Crypto' | 'Commodity'

export type TickerInfo = {
  symbol: string
  name: string
  type: TickerType
  description: string
  apiSymbol?: string // Twelve Data symbol when it differs (e.g. BTC/USD)
}

// Badge tint per asset class, shared by the picker and the asset node
export const TICKER_BADGE_CLASSES: Record<TickerType, string> = {
  ETF: 'bg-accent/10 text-accent/80 border border-accent/20',
  Stock: 'bg-surface-2 text-text-muted border border-text-muted/15',
  Crypto: 'bg-orange-500/10 text-orange-400/80 border border-orange-500/20',
  Commodity: 'bg-yellow-500/10 text-yellow-500/80 border border-yellow-500/20',
}

export const TICKERS: TickerInfo[] = [
  // --- Broad market ETFs ---
  { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', type: 'ETF', description: 'Tracks the S&P 500 index of 500 large-cap U.S. companies' },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', type: 'ETF', description: 'The original S&P 500 fund, most-traded ETF in the world' },
  { symbol: 'IVV', name: 'iShares Core S&P 500 ETF', type: 'ETF', description: 'Low-cost S&P 500 index fund from iShares' },
  { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', type: 'ETF', description: 'Tracks the entire U.S. stock market, large to micro cap' },
  { symbol: 'VT', name: 'Vanguard Total World Stock ETF', type: 'ETF', description: 'Global stock market in one fund, U.S. and international' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', type: 'ETF', description: 'Tracks the Nasdaq-100, heavy in large-cap tech' },
  { symbol: 'VUG', name: 'Vanguard Growth ETF', type: 'ETF', description: 'Large-cap U.S. growth stocks' },
  { symbol: 'VTV', name: 'Vanguard Value ETF', type: 'ETF', description: 'Large-cap U.S. value stocks' },
  { symbol: 'VO', name: 'Vanguard Mid-Cap ETF', type: 'ETF', description: 'Mid-sized U.S. companies' },
  { symbol: 'VB', name: 'Vanguard Small-Cap ETF', type: 'ETF', description: 'Small U.S. companies' },
  { symbol: 'IWM', name: 'iShares Russell 2000 ETF', type: 'ETF', description: 'Tracks the Russell 2000 small-cap index' },

  // --- International ETFs ---
  { symbol: 'VXUS', name: 'Vanguard Total International Stock ETF', type: 'ETF', description: 'Global stocks excluding the U.S.' },
  { symbol: 'VEA', name: 'Vanguard FTSE Developed Markets ETF', type: 'ETF', description: 'Developed-market stocks outside the U.S. (Europe, Japan)' },
  { symbol: 'VWO', name: 'Vanguard FTSE Emerging Markets ETF', type: 'ETF', description: 'Emerging-market stocks (China, India, Brazil)' },

  // --- Dividend / income ETFs ---
  { symbol: 'SCHD', name: 'Schwab U.S. Dividend Equity ETF', type: 'ETF', description: 'Quality U.S. companies with strong dividend records' },
  { symbol: 'VYM', name: 'Vanguard High Dividend Yield ETF', type: 'ETF', description: 'U.S. stocks with above-average dividend yields' },
  { symbol: 'VIG', name: 'Vanguard Dividend Appreciation ETF', type: 'ETF', description: 'Companies with 10+ years of dividend growth' },
  { symbol: 'JEPI', name: 'JPMorgan Equity Premium Income ETF', type: 'ETF', description: 'Income via covered calls on large-cap U.S. stocks' },

  // --- Bond ETFs ---
  { symbol: 'BND', name: 'Vanguard Total Bond Market ETF', type: 'ETF', description: 'Broad U.S. investment-grade bond market' },
  { symbol: 'AGG', name: 'iShares Core U.S. Aggregate Bond ETF', type: 'ETF', description: 'Broad U.S. bond market index' },
  { symbol: 'TLT', name: 'iShares 20+ Year Treasury Bond ETF', type: 'ETF', description: 'Long-term U.S. Treasury bonds' },
  { symbol: 'SHY', name: 'iShares 1-3 Year Treasury Bond ETF', type: 'ETF', description: 'Short-term U.S. Treasury bonds, low volatility' },
  { symbol: 'TIP', name: 'iShares TIPS Bond ETF', type: 'ETF', description: 'Inflation-protected U.S. Treasury bonds' },
  { symbol: 'LQD', name: 'iShares Investment Grade Corporate Bond ETF', type: 'ETF', description: 'High-quality U.S. corporate bonds' },
  { symbol: 'HYG', name: 'iShares High Yield Corporate Bond ETF', type: 'ETF', description: 'Higher-risk, higher-yield U.S. corporate bonds' },

  // --- Sector & thematic ETFs ---
  { symbol: 'VGT', name: 'Vanguard Information Technology ETF', type: 'ETF', description: 'U.S. technology sector' },
  { symbol: 'XLK', name: 'Technology Select Sector SPDR', type: 'ETF', description: 'Tech stocks within the S&P 500' },
  { symbol: 'SMH', name: 'VanEck Semiconductor ETF', type: 'ETF', description: 'Chipmakers and semiconductor equipment companies' },
  { symbol: 'XLE', name: 'Energy Select Sector SPDR', type: 'ETF', description: 'Oil, gas, and energy stocks within the S&P 500' },
  { symbol: 'XLF', name: 'Financial Select Sector SPDR', type: 'ETF', description: 'Banks, insurers, and financial firms in the S&P 500' },
  { symbol: 'XLV', name: 'Health Care Select Sector SPDR', type: 'ETF', description: 'Pharma, biotech, and healthcare in the S&P 500' },
  { symbol: 'XLY', name: 'Consumer Discretionary Select SPDR', type: 'ETF', description: 'Retail, autos, and leisure stocks in the S&P 500' },
  { symbol: 'XLP', name: 'Consumer Staples Select SPDR', type: 'ETF', description: 'Food, beverage, and household staples in the S&P 500' },
  { symbol: 'XLU', name: 'Utilities Select Sector SPDR', type: 'ETF', description: 'Electric and gas utilities in the S&P 500' },
  { symbol: 'XLI', name: 'Industrial Select Sector SPDR', type: 'ETF', description: 'Aerospace, machinery, and transport in the S&P 500' },
  { symbol: 'VNQ', name: 'Vanguard Real Estate ETF', type: 'ETF', description: 'U.S. real estate investment trusts (REITs)' },
  { symbol: 'ARKK', name: 'ARK Innovation ETF', type: 'ETF', description: 'Actively managed bets on disruptive tech companies' },

  // --- Commodities & crypto ETFs ---
  { symbol: 'GLD', name: 'SPDR Gold Shares', type: 'ETF', description: 'Tracks the price of gold bullion' },
  { symbol: 'SLV', name: 'iShares Silver Trust', type: 'ETF', description: 'Tracks the price of silver' },
  { symbol: 'IBIT', name: 'iShares Bitcoin Trust', type: 'ETF', description: 'Tracks the price of Bitcoin' },

  // --- Digital assets ---
  { symbol: 'BTC', name: 'Bitcoin', type: 'Crypto', description: 'The original cryptocurrency, digital store of value', apiSymbol: 'BTC/USD' },
  { symbol: 'ETH', name: 'Ethereum', type: 'Crypto', description: 'Smart-contract platform behind most of DeFi and NFTs', apiSymbol: 'ETH/USD' },
  { symbol: 'SOL', name: 'Solana', type: 'Crypto', description: 'High-throughput blockchain for apps and payments', apiSymbol: 'SOL/USD' },
  { symbol: 'HYPE', name: 'Hyperliquid', type: 'Crypto', description: 'Token of the Hyperliquid on-chain trading exchange', apiSymbol: 'HYPE/USD' },
  { symbol: 'BNB', name: 'BNB', type: 'Crypto', description: 'Binance exchange and ecosystem token', apiSymbol: 'BNB/USD' },
  { symbol: 'XRP', name: 'XRP', type: 'Crypto', description: 'Payments token for cross-border transfers', apiSymbol: 'XRP/USD' },
  { symbol: 'DOGE', name: 'Dogecoin', type: 'Crypto', description: 'Meme coin turned mainstream payment token', apiSymbol: 'DOGE/USD' },
  { symbol: 'ADA', name: 'Cardano', type: 'Crypto', description: 'Research-driven proof-of-stake blockchain', apiSymbol: 'ADA/USD' },
  { symbol: 'AVAX', name: 'Avalanche', type: 'Crypto', description: 'Fast smart-contract chain with subnets', apiSymbol: 'AVAX/USD' },
  { symbol: 'LINK', name: 'Chainlink', type: 'Crypto', description: 'Oracle network feeding real-world data on-chain', apiSymbol: 'LINK/USD' },
  { symbol: 'DOT', name: 'Polkadot', type: 'Crypto', description: 'Interoperability network connecting blockchains', apiSymbol: 'DOT/USD' },
  { symbol: 'LTC', name: 'Litecoin', type: 'Crypto', description: 'Early Bitcoin fork focused on cheap payments', apiSymbol: 'LTC/USD' },
  { symbol: 'USDC', name: 'USD Coin', type: 'Crypto', description: 'Dollar-pegged stablecoin — pair with Lend for yield', apiSymbol: 'USDC/USD' },

  // --- Commodities (spot) ---
  { symbol: 'XAU', name: 'Gold', type: 'Commodity', description: 'Spot price of gold per troy ounce', apiSymbol: 'XAU/USD' },
  { symbol: 'XAG', name: 'Silver', type: 'Commodity', description: 'Spot price of silver per troy ounce', apiSymbol: 'XAG/USD' },

  // --- Mega-cap tech stocks ---
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'Stock', description: 'iPhone, Mac, and services giant' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', type: 'Stock', description: 'Windows, Office, and Azure cloud computing' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'Stock', description: 'Google search, YouTube, and online advertising' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'Stock', description: 'E-commerce leader and AWS cloud provider' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', type: 'Stock', description: 'GPUs and chips powering AI and gaming' },
  { symbol: 'META', name: 'Meta Platforms Inc.', type: 'Stock', description: 'Facebook, Instagram, and WhatsApp' },
  { symbol: 'TSLA', name: 'Tesla Inc.', type: 'Stock', description: 'Electric vehicles and energy storage' },
  { symbol: 'AVGO', name: 'Broadcom Inc.', type: 'Stock', description: 'Networking chips and infrastructure software' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', type: 'Stock', description: 'CPUs and GPUs competing with Intel and NVIDIA' },
  { symbol: 'INTC', name: 'Intel Corp.', type: 'Stock', description: 'PC and server processors, chip manufacturing' },
  { symbol: 'CRM', name: 'Salesforce Inc.', type: 'Stock', description: 'Cloud-based customer relationship software' },
  { symbol: 'ORCL', name: 'Oracle Corp.', type: 'Stock', description: 'Databases and enterprise cloud infrastructure' },
  { symbol: 'ADBE', name: 'Adobe Inc.', type: 'Stock', description: 'Photoshop, PDF, and creative software' },
  { symbol: 'NFLX', name: 'Netflix Inc.', type: 'Stock', description: 'Streaming video entertainment' },
  { symbol: 'PLTR', name: 'Palantir Technologies', type: 'Stock', description: 'Data analytics for government and enterprise' },
  { symbol: 'UBER', name: 'Uber Technologies', type: 'Stock', description: 'Ride-hailing and food delivery platform' },
  { symbol: 'SHOP', name: 'Shopify Inc.', type: 'Stock', description: 'E-commerce platform for online stores' },
  { symbol: 'PYPL', name: 'PayPal Holdings', type: 'Stock', description: 'Digital payments and money transfers' },
  { symbol: 'COIN', name: 'Coinbase Global', type: 'Stock', description: 'Cryptocurrency exchange platform' },

  // --- Blue chips ---
  { symbol: 'BRK.B', name: 'Berkshire Hathaway', type: 'Stock', description: "Warren Buffett's diversified holding company" },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', type: 'Stock', description: 'Largest U.S. bank' },
  { symbol: 'V', name: 'Visa Inc.', type: 'Stock', description: 'Global card payments network' },
  { symbol: 'MA', name: 'Mastercard Inc.', type: 'Stock', description: 'Global card payments network' },
  { symbol: 'UNH', name: 'UnitedHealth Group', type: 'Stock', description: 'Largest U.S. health insurer' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', type: 'Stock', description: 'Pharmaceuticals and medical devices' },
  { symbol: 'LLY', name: 'Eli Lilly & Co.', type: 'Stock', description: 'Pharma giant behind GLP-1 weight-loss drugs' },
  { symbol: 'ABBV', name: 'AbbVie Inc.', type: 'Stock', description: 'Pharmaceuticals, immunology and oncology' },
  { symbol: 'MRK', name: 'Merck & Co.', type: 'Stock', description: 'Pharmaceuticals, oncology and vaccines' },
  { symbol: 'WMT', name: 'Walmart Inc.', type: 'Stock', description: 'World-largest retailer' },
  { symbol: 'COST', name: 'Costco Wholesale', type: 'Stock', description: 'Membership warehouse retailer' },
  { symbol: 'PG', name: 'Procter & Gamble', type: 'Stock', description: 'Household and personal care brands' },
  { symbol: 'KO', name: 'Coca-Cola Co.', type: 'Stock', description: 'Beverages sold in nearly every country' },
  { symbol: 'PEP', name: 'PepsiCo Inc.', type: 'Stock', description: 'Beverages and snack foods (Frito-Lay, Quaker)' },
  { symbol: 'MCD', name: "McDonald's Corp.", type: 'Stock', description: 'Global fast-food franchise' },
  { symbol: 'HD', name: 'Home Depot Inc.', type: 'Stock', description: 'Home improvement retail' },
  { symbol: 'NKE', name: 'Nike Inc.', type: 'Stock', description: 'Athletic footwear and apparel' },
  { symbol: 'SBUX', name: 'Starbucks Corp.', type: 'Stock', description: 'Global coffeehouse chain' },
  { symbol: 'DIS', name: 'Walt Disney Co.', type: 'Stock', description: 'Entertainment, theme parks, and streaming' },
  { symbol: 'XOM', name: 'Exxon Mobil Corp.', type: 'Stock', description: 'Oil and gas supermajor' },
  { symbol: 'CVX', name: 'Chevron Corp.', type: 'Stock', description: 'Oil and gas supermajor' },
  { symbol: 'BA', name: 'Boeing Co.', type: 'Stock', description: 'Commercial and defense aircraft' },
  { symbol: 'CAT', name: 'Caterpillar Inc.', type: 'Stock', description: 'Construction and mining equipment' },
  { symbol: 'GE', name: 'GE Aerospace', type: 'Stock', description: 'Jet engines and aerospace systems' },
  { symbol: 'T', name: 'AT&T Inc.', type: 'Stock', description: 'Telecom and wireless carrier' },
  { symbol: 'VZ', name: 'Verizon Communications', type: 'Stock', description: 'Telecom and wireless carrier' },
]

const bySymbol = new Map(TICKERS.map((t) => [t.symbol, t]))

export function getTickerInfo(symbol: string): TickerInfo | undefined {
  return bySymbol.get(symbol.trim().toUpperCase())
}
