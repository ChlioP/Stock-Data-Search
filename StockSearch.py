from flask import Flask, send_from_directory, jsonify, request, render_template
import requests
from flask_cors import CORS
from logging.handlers import RotatingFileHandler
import logging
import os

logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__, static_url_path='/static', static_folder='static')
CORS(app)

TIINGO_API_KEY = 'YOUR_API_KEY'

@app.route('/')
def home():
    return render_template('StockSearch.html')


def get_tingo_data(endpoint, ticker_symbol, additional_params=None):
    base_url = f"https://api.tiingo.com/{endpoint}/{ticker_symbol}"
    headers = {'Content-Type': 'application/json'}
    params = {'token': TIINGO_API_KEY}
    if additional_params:
        params.update(additional_params)

    response = requests.get(base_url, headers=headers, params=params)
    print("Response from Tiingo: ", response.json())  # Log the response data
    return response


@app.route('/company-outlook')
def company_outlook():
    ticker_symbol = request.args.get('symbol')
    if not ticker_symbol:
        return jsonify({'error': 'Ticker symbol is required'}), 400

    response = get_tingo_data('tiingo/daily', ticker_symbol)

    if response.status_code == 403:
        return jsonify({'error': 'Forbidden: Check your API key or permissions.'}), 403
    elif response.status_code == 200:
        data = response.json()

        if not data or 'name' not in data:
            return jsonify({'error': 'No record has been found for the given symbol.'}), 404

        return jsonify({
            'Company Name': data.get('name'),
            'Ticker Symbol': data.get('ticker'),
            'Exchange Code': data.get('exchangeCode'),
            'Company Start Date': data.get('startDate'),
            'Description': data.get('description')
        })
    else:
        return jsonify({'error': 'Failed to fetch data'}), response.status_code

@app.route('/stock-summary')
def stock_summary():
    ticker_symbol = request.args.get('symbol')
    if not ticker_symbol:
        return jsonify({'error': 'Ticker symbol is required'}), 400

    response = get_tingo_data('iex', ticker_symbol)
    
    if response.status_code == 403:
        return jsonify({'error': 'Forbidden: Check your API key or permissions.'}), 403
    elif response.status_code == 200:
        data = response.json()

        if not data or not isinstance(data, list) or not data[0]:
            return jsonify({'error': 'No record has been found for the given symbol.'}), 404

        data = data[0]

        return jsonify({
            'Ticker Symbol': data.get('ticker'),
            'Trading Day': data.get('timestamp'),  
            'Previous Close': data.get('prevClose'),
            'Opening Price': data.get('open'),
            'High Price': data.get('high'),
            'Low Price': data.get('low'),
            'Last Price': data.get('last'),
            'Change': data.get('last') - data.get('prevClose'),
            'Change Percent': ((data.get('last') - data.get('prevClose')) / data.get('prevClose') * 100) if data.get('prevClose') else 0,
            'Volume': data.get('volume')
        })
    else:
        return jsonify({'error': 'Failed to fetch data'}), response.status_code
   
@app.route('/news')
def get_latest_news():
    tickers = request.args.get('tickers')
    sources = request.args.get('source')
    startDate = request.args.get('startDate')
    endDate = request.args.get('endDate')
    limit = request.args.get('limit')
    offset = request.args.get('offset')
    sortBy = request.args.get('sortBy')

    params = {
        'token': TIINGO_API_KEY,
        'tickers': tickers,
        'source': sources,
        'startDate': startDate,
        'endDate': endDate,
        'limit': limit,
        'offset': offset,
        'sortBy': sortBy
    }
    # Clean parameters dictionary by removing None values
    params = {key: value for key, value in params.items() if value is not None}

    url = "https://api.tiingo.com/tiingo/news"
    response = requests.get(url, headers={'Content-Type': 'application/json'}, params=params)
    
    if response.status_code == 200:
        return jsonify(response.json())
    else:
        return jsonify({'error': 'Failed to fetch news', 'statusCode': response.status_code}), response.status_code


def process_response(response, stock_summary=False):
    if response.status_code == 200:
        data = response.json()
        if stock_summary and isinstance(data, list) and data:
            data = data[0]
            change = data['last'] - data['prevClose']
            change_percent = (change / data['prevClose']) * 100
            data.update({
                'Change': change,
                'Change Percent': change_percent,
                'Direction': 'up' if change > 0 else 'down'
            })
        return jsonify(data)
    else:
        return jsonify({'error': 'Failed to fetch data', 'statusCode': response.status_code}), response.status_code

if __name__ == '__main__':
    app.run(debug=True)
