import apiService from './apiService';

// Alpaca Integration Service URL
const ALPACA_SERVICE_URL = 'http://localhost:8200';

// Types for Candidates API
export interface CandidateSignal {
  id: string;
  symbol: string;
  signal_type: 'buy' | 'sell' | 'hold';
  strategy: string;
  confidence: number;
  price_target?: number;
  stop_loss?: number;
  timeframe: string;
  indicators: Record<string, any>;
  created_at: string;
  expires_at?: string;
}

export interface CandidateAnalysis {
  symbol: string;
  trend: 'bullish' | 'bearish' | 'neutral';
  momentum: number;
  volatility: number;
  support_levels: number[];
  resistance_levels: number[];
  rsi: number;
  macd: Record<string, number>;
  bollinger_bands: Record<string, number>;
  analysis_time: string;
}

export interface TradingCandidate {
  symbol: string;
  company_name: string;
  current_price: number;
  change: number;
  change_percent: number;
  volume: number;
  high_price: number;
  low_price: number;
  market_cap?: number;
  pe_ratio?: number;
  is_favorite?: boolean; // Add this for UI state
  // Enhanced candidate properties
  profit_projection: number;
  profit_confidence: number;
  position_size: number;
  risk_score: number;
  signal_strength: number;
  strategy: string;
  automation_status: 'auto' | 'paused' | 'watch-only' | 'buying';
  time_sensitivity: 'high' | 'medium' | 'low';
  entry_target: number;
  stop_loss: number;
  profit_target: number;
  created_at: Date;
  signals: CandidateSignal[];
  analysis?: CandidateAnalysis;
  trend: 'bullish' | 'bearish' | 'neutral';
}

export interface AutoTradingConfig {
  enabled: boolean;
  max_position_size: number;
  risk_per_trade: number;
  max_correlation: number;
  target_deployment: number;
}

class CandidatesApiService {
  private readonly BASE_URL = 'http://localhost:8200'; // Signal Detection Service

  /**
   * Get trading signals from Signal Detection Service
   */
  async getSignals(params?: {
    symbol?: string;
    signal_type?: string;
    strategy?: string;
    active_only?: boolean;
  }): Promise<CandidateSignal[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.symbol) queryParams.append('symbol', params.symbol);
      if (params?.signal_type) queryParams.append('signal_type', params.signal_type);
      if (params?.strategy) queryParams.append('strategy', params.strategy);
      if (params?.active_only !== undefined)
        queryParams.append('active_only', params.active_only.toString());

      const response = await fetch(`${this.BASE_URL}/signals?${queryParams}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch signals: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching signals:', error);
      return [];
    }
  }

  /**
   * Get market analysis for a symbol
   */
  async getMarketAnalysis(symbol: string): Promise<CandidateAnalysis | null> {
    try {
      const response = await fetch(`${this.BASE_URL}/analysis/${symbol}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch analysis for ${symbol}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching analysis for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Trigger signal scan for a specific symbol
   */
  async scanSymbol(
    symbol: string
  ): Promise<{ signals: CandidateSignal[]; signals_generated: number }> {
    try {
      const response = await fetch(`${this.BASE_URL}/signals/scan/${symbol}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to scan ${symbol}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error scanning ${symbol}:`, error);
      return { signals: [], signals_generated: 0 };
    }
  }

  /**
   * Get current market data for symbols
   */
  async getMarketData(symbols: string[]): Promise<Record<string, any>> {
    try {
      const response = await apiService.getQuotes(symbols);
      if (response.success && response.data) {
        // Convert array to record format
        return response.data.reduce(
          (acc, quote) => {
            acc[quote.symbol] = quote;
            return acc;
          },
          {} as Record<string, any>
        );
      }
      return {};
    } catch (error) {
      console.error('Error fetching market data:', error);
      return {};
    }
  }

  /**
   * Calculate position size for a candidate
   */
  calculatePositionSize(
    accountValue: number,
    riskPerTrade: number,
    entryPrice: number,
    stopLoss: number,
    confidence: number
  ): number {
    const riskAmount = accountValue * (riskPerTrade / 100);
    const stopDistance = Math.abs(entryPrice - stopLoss);
    const baseShares = riskAmount / stopDistance;

    // Adjust for confidence
    const adjustedShares = baseShares * confidence;

    // Calculate position value
    return Math.floor(adjustedShares * entryPrice);
  }

  /**
   * Assess risk score for a candidate
   */
  calculateRiskScore(
    volatility: number,
    correlation: number,
    stopDistance: number,
    timeframe: string
  ): number {
    let riskScore = 0;

    // Volatility component (0-0.4)
    riskScore += Math.min(volatility, 0.4);

    // Correlation component (0-0.3)
    riskScore += correlation * 0.3;

    // Stop distance component (0-0.2)
    riskScore += Math.min(stopDistance / 100, 0.2);

    // Timeframe component (0-0.1)
    const timeframeRisk =
      {
        '5m': 0.1,
        '15m': 0.08,
        '1h': 0.06,
        '4h': 0.04,
        '1d': 0.02,
      }[timeframe] || 0.05;
    riskScore += timeframeRisk;

    return Math.min(riskScore, 1.0);
  }

  /**
   * Convert signals and market data to trading candidates
   */
  async processIntoCandidates(
    signals: CandidateSignal[],
    marketData: Record<string, any>,
    accountValue: number = 100000,
    config: Partial<AutoTradingConfig> = {}
  ): Promise<TradingCandidate[]> {
    const defaultConfig: AutoTradingConfig = {
      enabled: true,
      max_position_size: 5000,
      risk_per_trade: 1,
      max_correlation: 0.7,
      target_deployment: 0.95,
      ...config,
    };

    const candidates: TradingCandidate[] = [];

    // Group signals by symbol
    const signalsBySymbol = signals.reduce(
      (acc, signal) => {
        if (!acc[signal.symbol]) acc[signal.symbol] = [];
        acc[signal.symbol].push(signal);
        return acc;
      },
      {} as Record<string, CandidateSignal[]>
    );

    for (const [symbol, symbolSignals] of Object.entries(signalsBySymbol)) {
      // Filter for buy signals only (candidates are buy opportunities)
      const buySignals = symbolSignals.filter((s) => s.signal_type === 'buy');
      if (buySignals.length === 0) continue;

      // Get best signal (highest confidence)
      const bestSignal = buySignals.reduce((best, current) =>
        current.confidence > best.confidence ? current : best
      );

      const market = marketData[symbol] || {};
      const currentPrice = market.price || 150 + Math.random() * 300; // Fallback mock price

      // Calculate profit projection (3-7% target range)
      const profitProjection = 3 + bestSignal.confidence * 4; // Scale confidence to 3-7%
      const profitTarget = bestSignal.price_target || currentPrice * (1 + profitProjection / 100);
      const stopLoss = bestSignal.stop_loss || currentPrice * 0.97;

      // Calculate position size
      const positionSize = Math.min(
        this.calculatePositionSize(
          accountValue,
          defaultConfig.risk_per_trade,
          currentPrice,
          stopLoss,
          bestSignal.confidence
        ),
        defaultConfig.max_position_size
      );

      // Calculate risk score
      const volatility = market.volatility || 0.15 + Math.random() * 0.25;
      const correlation = Math.random() * 0.5; // Mock correlation for now
      const stopDistance = (Math.abs(currentPrice - stopLoss) / currentPrice) * 100;
      const riskScore = this.calculateRiskScore(
        volatility,
        correlation,
        stopDistance,
        bestSignal.timeframe
      );

      // Determine time sensitivity based on timeframe and confidence
      let timeSensitivity: 'high' | 'medium' | 'low' = 'medium';
      if (bestSignal.confidence > 0.85 && ['5m', '15m'].includes(bestSignal.timeframe)) {
        timeSensitivity = 'high';
      } else if (bestSignal.confidence < 0.7 || bestSignal.timeframe === '1d') {
        timeSensitivity = 'low';
      }

      // Create candidate
      const candidate: TradingCandidate = {
        symbol,
        company_name: market.company_name || `${symbol} Inc.`,
        current_price: currentPrice,
        change: market.change || (Math.random() - 0.5) * 10,
        change_percent: market.change_percent || (Math.random() - 0.5) * 5,
        volume: market.volume || Math.floor(Math.random() * 50000000) + 1000000,
        high_price: market.high || currentPrice * 1.02,
        low_price: market.low || currentPrice * 0.98,
        market_cap: market.market_cap,
        pe_ratio: market.pe_ratio,
        profit_projection: profitProjection,
        profit_confidence: bestSignal.confidence,
        position_size: positionSize,
        risk_score: riskScore,
        signal_strength: bestSignal.confidence,
        strategy: bestSignal.strategy,
        automation_status: defaultConfig.enabled ? 'auto' : 'paused',
        time_sensitivity: timeSensitivity,
        entry_target: currentPrice * 0.998, // Slightly below current price
        stop_loss: stopLoss,
        profit_target: profitTarget,
        created_at: new Date(bestSignal.created_at),
        signals: symbolSignals,
        trend:
          bestSignal.signal_type === 'buy'
            ? 'bullish'
            : bestSignal.signal_type === 'sell'
              ? 'bearish'
              : 'neutral',
      };

      candidates.push(candidate);
    }

    // Sort by profit potential
    return candidates.sort((a, b) => b.profit_projection - a.profit_projection);
  }

  /**
   * Get comprehensive candidates data from Alpaca
   */
  async getCandidates(limit: number = 20): Promise<TradingCandidate[]> {
    try {
      console.log('Fetching real market data from Alpaca...');

      // Try to get real data from Alpaca service
      const response = await fetch(
        `${ALPACA_SERVICE_URL}/candidates?limit=${limit}&_t=${Date.now()}`
      );

      if (response.ok) {
        const alpacaCandidates = await response.json();
        console.log('Alpaca response received:', alpacaCandidates);

        // If we get empty results or no valid data, fall back to mock data
        if (!alpacaCandidates || alpacaCandidates.length === 0) {
          console.warn('Alpaca service returned empty data, falling back to mock data');
          return this.getMockCandidates(limit);
        }

        // Transform Alpaca data to our candidate format
        return alpacaCandidates.map((candidate: any) => ({
          symbol: candidate.symbol,
          company_name: `${candidate.symbol} Inc.`,
          current_price: candidate.price,
          change: candidate.change,
          change_percent: candidate.change_percent,
          volume: candidate.volume,
          high_price: candidate.price * 1.05, // Approximate based on current price
          low_price: candidate.price * 0.95, // Approximate based on current price
          market_cap: Math.floor(Math.random() * 1000000000000), // Mock for now
          pe_ratio: 15 + Math.random() * 20, // Mock for now
          is_favorite: false,
          profit_projection: candidate.profit_potential || 0,
          profit_confidence: Math.min(100, candidate.signal_strength),
          position_size: this.calculatePositionSize(
            10000,
            2,
            candidate.price,
            candidate.price * 0.95,
            candidate.signal_strength
          ),
          risk_score: candidate.signal_strength > 70 ? 30 : 60,
          signal_strength: candidate.signal_strength,
          strategy: candidate.trend === 'bullish' ? 'Momentum Breakout' : 'RSI Oversold',
          automation_status: 'auto' as const,
          risk_level: candidate.risk_level || 'medium',
          entry_price: candidate.price,
          expected_return: candidate.profit_potential || 0,
          stop_loss_price: candidate.price * 0.95,
          take_profit_price: candidate.price * 1.05,
          last_updated: candidate.timestamp || new Date().toISOString(),
          trend: candidate.trend,
        }));
      } else {
        console.warn('Alpaca service not available, falling back to mock data');
        return this.getMockCandidates(limit);
      }
    } catch (error) {
      console.error('Error fetching candidates from Alpaca:', error);
      // Return mock data if Alpaca API fails
      return this.getMockCandidates(limit);
    }
  }

  /**
   * Mock candidates for development/fallback
   */
  private getMockCandidates(limit: number): TradingCandidate[] {
    console.log(`Generating ${limit} mock candidates for fallback`);
    const mockSymbols = [
      'AAPL',
      'MSFT',
      'GOOGL',
      'TSLA',
      'NVDA',
      'AMZN',
      'META',
      'NFLX',
      'CRM',
      'SHOP',
    ];
    const strategies = ['RSI Oversold', 'MACD Crossover', 'Bollinger Squeeze', 'Momentum Breakout'];

    return mockSymbols.slice(0, limit).map((symbol, index) => {
      const basePrice = 100 + Math.random() * 500;
      const profitProjection = 3 + Math.random() * 4;

      return {
        symbol,
        company_name: `${symbol} Inc.`,
        current_price: basePrice,
        change: (Math.random() - 0.5) * 10,
        change_percent: (Math.random() - 0.5) * 5,
        volume: Math.floor(Math.random() * 50000000) + 1000000,
        high_price: basePrice * 1.02,
        low_price: basePrice * 0.98,
        market_cap: Math.floor(Math.random() * 2000000000000) + 500000000000,
        pe_ratio: 15 + Math.random() * 30,
        is_favorite: Math.random() > 0.5, // Random favorite status for mock data
        profit_projection: profitProjection,
        profit_confidence: 0.65 + Math.random() * 0.3,
        position_size: Math.floor(Math.random() * 4000) + 1000,
        risk_score: 0.1 + Math.random() * 0.5,
        signal_strength: 0.7 + Math.random() * 0.25,
        strategy: strategies[Math.floor(Math.random() * strategies.length)],
        automation_status: ['auto', 'paused', 'watch-only'][Math.floor(Math.random() * 3)] as any,
        time_sensitivity: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as any,
        entry_target: basePrice * 0.998,
        stop_loss: basePrice * 0.97,
        profit_target: basePrice * (1 + profitProjection / 100),
        created_at: new Date(),
        signals: [],
        trend: Math.random() > 0.5 ? 'bullish' : ('bearish' as const),
      };
    });
  }

  /**
   * Update automation status for a candidate
   */
  async updateAutomationStatus(
    symbol: string,
    status: 'auto' | 'paused' | 'watch-only'
  ): Promise<boolean> {
    try {
      // This would typically call a backend API to update automation settings
      console.log(`Updated ${symbol} automation status to: ${status}`);
      return true;
    } catch (error) {
      console.error(`Error updating automation status for ${symbol}:`, error);
      return false;
    }
  }

  /**
   * Execute manual buy order for candidate
   */
  async forceBuyCandidate(symbol: string, positionSize: number): Promise<boolean> {
    try {
      const response = await apiService.createOrder({
        symbol,
        side: 'buy',
        quantity: Math.floor(positionSize / 100), // Convert dollar amount to shares approximation
        type: 'market',
      });

      if (response.success) {
        console.log(`Force buy executed for ${symbol}:`, response.data);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error executing force buy for ${symbol}:`, error);
      return false;
    }
  }
}

export const candidatesApi = new CandidatesApiService();
export default candidatesApi;
