export interface StockData {
  tickerName: string;
  signalType: string;
  stockPrice: string;
  date: string;
  sourceFile?: string;
  isPicked?: boolean;
}

export interface Directory {
  name: string;
  path: string;
  files: string[];
  subdirectories: Directory[];
}

export interface PickedStock {
  id: string;
  ticker_name: string;
  signal_type: string;
  stock_price: string;
  date: string;
  source_file?: string;
  priority: 'high' | 'moderate' | 'low';
  created_at: string;
}

export interface Suggestion {
  id: string;
  user_name: string;
  content: string;
  created_at: string;
  replies?: SuggestionReply[];
}

export interface SuggestionReply {
  id: string;
  suggestion_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  user_name: string;
  message: string;
  created_at: string;
}
