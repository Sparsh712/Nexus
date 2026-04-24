from fastapi import APIRouter, HTTPException
import requests
import pandas as pd
import numpy as np

router = APIRouter(prefix="/api/mutual", tags=["Mutual Funds"])

MFAPI_BASE_URL = "https://api.mfapi.in"

def fetch_all_schemes():
    url = f"{MFAPI_BASE_URL}/mf"
    r = requests.get(url)
    if r.ok:
        return {item["schemeCode"]: item["schemeName"] for item in r.json()}
    return {}

def fetch_scheme_details(scheme_code):
    url = f"{MFAPI_BASE_URL}/mf/{scheme_code}"
    r = requests.get(url)
    if r.ok:
        meta = r.json().get("meta", {})
        return meta
    return {}

def fetch_historical_nav(scheme_code):
    url = f"{MFAPI_BASE_URL}/mf/{scheme_code}"
    r = requests.get(url)
    if r.ok:
        data = r.json().get("data", [])
        # Return in ascending order (Oldest first) and convert NAV to float
        processed = []
        for item in reversed(data):
            try:
                processed.append({
                    "date": item["date"],
                    "nav": float(item["nav"])
                })
            except (ValueError, TypeError, KeyError):
                continue
        return processed
    return []

@router.get("/schemes")
async def get_schemes(search: str = ""):
    all_schemes = fetch_all_schemes()
    if search:
        filtered = {code: name for code, name in all_schemes.items() if search.lower() in name.lower()}
        return filtered if filtered else {}
    return all_schemes

@router.get("/scheme-details/{scheme_code}")
async def get_scheme_details(scheme_code: str):
    url = f"{MFAPI_BASE_URL}/mf/{scheme_code}"
    r = requests.get(url)
    if r.ok:
        full_data = r.json()
        meta = full_data.get("meta", {})
        data = full_data.get("data", [])
        
        # Get current NAV from most recent data point
        current_nav = None
        nav_date = None
        if data:
            latest = data[0]  # Most recent NAV is first
            try:
                current_nav = float(latest.get("nav", 0))
                nav_date = latest.get("date", "")
            except (ValueError, TypeError):
                current_nav = 0
        
        # Build response with metadata and current NAV
        result = {
            "scheme_name": meta.get("scheme_name", ""),
            "fund_house": meta.get("fund_house", ""),
            "scheme_type": meta.get("scheme_type", ""),
            "scheme_category": meta.get("scheme_category", ""),
            "nav": current_nav,
            "nav_date": nav_date
        }
        return result
    
    return {"nav": 0, "scheme_name": "", "fund_house": "", "scheme_type": "", "scheme_category": ""}

@router.get("/historical-nav/{scheme_code}")
async def get_historical_nav(scheme_code: str):
    return fetch_historical_nav(scheme_code) or []

@router.get("/compare-navs")
async def compare_navs(scheme_codes: str):
    codes = scheme_codes.split(",")
    comparison_data = {}
    for code in codes:
        navs = fetch_historical_nav(code.strip())
        if navs:
            df = pd.DataFrame(navs)
            df["date"] = pd.to_datetime(df["date"], dayfirst=True)
            df["nav"] = pd.to_numeric(df["nav"], errors="coerce")
            df = df.dropna(subset=["nav"])
            df = df.set_index("date")
            comparison_data[code] = df["nav"]
    if comparison_data:
        combined = pd.concat(comparison_data.values(), axis=1, keys=comparison_data.keys()).reset_index()
        combined.columns = ["date"] + [f"{code}_nav" for code in comparison_data.keys()]
        return combined.fillna("").astype(str).to_dict(orient="records")
    return []

@router.get("/performance-heatmap/{scheme_code}")
async def get_performance_heatmap(scheme_code: str):
    navs = fetch_historical_nav(scheme_code)
    if navs:
        df = pd.DataFrame(navs)
        df["date"] = pd.to_datetime(df["date"], dayfirst=True)
        df["nav"] = pd.to_numeric(df["nav"], errors="coerce")
        df.dropna(subset=["nav"], inplace=True)
        
        # Calculate monthly returns
        df["year"] = df["date"].dt.year
        df["month"] = df["date"].dt.month
        
        # Get first and last NAV of each month
        monthly_data = df.groupby(["year", "month"]).agg({
            "nav": ["first", "last"]
        }).reset_index()
        monthly_data.columns = ["year", "month", "first_nav", "last_nav"]
        
        # Calculate percentage change
        monthly_data["value"] = ((monthly_data["last_nav"] - monthly_data["first_nav"]) / monthly_data["first_nav"]) * 100
        monthly_data["nav"] = monthly_data["last_nav"]
        
        heatmap = monthly_data[["year", "month", "value", "nav"]].to_dict(orient="records")
        return heatmap
    return []

@router.get("/risk-volatility/{scheme_code}")
async def get_risk_volatility(scheme_code: str):
    navs = fetch_historical_nav(scheme_code)
    if not navs:
        return {
            "annualized_volatility": 0.0,
            "annualized_return": 0.0,
            "sharpe_ratio": 0.0,
            "returns": []
        }
    df = pd.DataFrame(navs)
    df["date"] = pd.to_datetime(df["date"], dayfirst=True)
    df["nav"] = pd.to_numeric(df["nav"], errors="coerce")
    df.dropna(subset=["nav"], inplace=True)
    df["returns"] = df["nav"].pct_change()
    df.dropna(subset=["returns"], inplace=True)
    annualized_volatility = df["returns"].std() * (252**0.5)
    annualized_return = (df["returns"].mean() + 1) ** 252 - 1
    risk_free_rate = 0.06
    sharpe_ratio = (annualized_return - risk_free_rate) / annualized_volatility if annualized_volatility > 0 else 0.0
    returns_list = [
        {"date": row["date"].strftime("%Y-%m-%d"), "returns": round(row["returns"], 8)}
        for idx, row in df.iterrows()
    ]
    return {
        "annualized_volatility": float(annualized_volatility),
        "annualized_return": float(annualized_return),
        "sharpe_ratio": float(sharpe_ratio),
        "returns": returns_list
    }

@router.get("/monte-carlo-prediction/{scheme_code}")
async def get_monte_carlo_prediction(scheme_code: str, num_simulations: int = 1000, days: int = 252):
    navs = fetch_historical_nav(scheme_code)
    if not navs:
        return {"message": "No NAV data"}
    df = pd.DataFrame(navs)
    df["nav"] = pd.to_numeric(df["nav"], errors="coerce")
    df = df.dropna(subset=["nav"])
    df["returns"] = df["nav"].pct_change()
    df = df.dropna(subset=["returns"])
    if len(df["returns"]) < 2:
        return {"message": "Insufficient data for Monte Carlo simulation"}
    mu = df["returns"].mean()
    sigma = df["returns"].std()
    last_nav = float(df["nav"].iloc[-1])
    simulations = np.zeros((num_simulations, days))
    simulations[:, 0] = last_nav
    for t in range(1, days):
        random_returns = np.random.normal(mu, sigma, num_simulations)
        simulations[:, t] = simulations[:, t - 1] * (1 + random_returns)
    expected_nav = float(np.mean(simulations[:, -1]))
    prob_positive = float(np.mean(simulations[:, -1] > last_nav))
    percentile_5 = float(np.percentile(simulations[:, -1], 5))
    percentile_95 = float(np.percentile(simulations[:, -1], 95))
    
    # Prepare simulation paths for visualization (sample 4 simulations)
    simulation_paths = []
    for i in range(min(4, num_simulations)):
        simulation_paths.append({
            "name": f"Simulation {i + 1}",
            "data": [{"day": day, "value": float(simulations[i, day])} for day in range(0, days, 5)]  # Every 5 days
        })
    
    # Historical + Predicted path
    historical_predicted = [{"day": day, "value": float(np.mean(simulations[:, day]))} for day in range(0, days, 5)]
    
    return {
        "expected_nav": expected_nav,
        "probability_positive_return": prob_positive * 100,
        "lower_bound_5th_percentile": percentile_5,
        "upper_bound_95th_percentile": percentile_95,
        "last_nav": last_nav,
        "simulation_paths": simulation_paths,
        "historical_predicted": historical_predicted
    }
