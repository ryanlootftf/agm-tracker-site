-- Create the search_stocks function for bulletproof ILIKE queries
-- that works correctly with all-numeric stock_code values.

CREATE OR REPLACE FUNCTION search_stocks(search_term text)
RETURNS TABLE(stock_code text, symbol text, company_name text)
LANGUAGE sql
STABLE
AS $$
  SELECT stock_code, symbol, company_name
  FROM stocks
  WHERE is_active = true
    AND (
         symbol        ILIKE '%' || search_term || '%'
      OR company_name  ILIKE '%' || search_term || '%'
      OR stock_code    ILIKE '%' || search_term || '%'
    )
  LIMIT 10;
$$;