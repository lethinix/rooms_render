"""
╔══════════════════════════════════════════════════════════════════════════════╗
║        Iowa City, IA  — Scikit-Learn Weather Prediction Model               ║
║        Location: 41.6611°N  91.5302°W  |  ZIP: 52246                        ║
║        Thesis Research Pipeline  ·  Python 3.12  ·  scikit-learn            ║
╚══════════════════════════════════════════════════════════════════════════════╝

OVERVIEW
────────
This module builds two complementary predictive pipelines for Iowa City:

  1. REGRESSION  → Predict next-day temperature (max, min) & precipitation
  2. CLASSIFICATION → Predict storm type from WMO weather codes

DATA SOURCE
───────────
  Open-Meteo Historical Weather API  (https://open-meteo.com)
  • Free, no API key required
  • Powered by ERA5 reanalysis from ECMWF (European Centre for
    Medium-Range Weather Forecasts)
  • ERA5 reconstructs historical weather from physics-based models
    + satellite/station observations going back to 1940

WHY IOWA CITY?
──────────────
  Iowa City sits in the Midwest continental climate zone — it experiences
  all four distinct seasons, significant snowfall, severe thunderstorms
  (tornado alley proximity), and dramatic temperature swings, making it
  an ideal location for studying a wide spectrum of weather events.

LEARNING GUIDE — KEY CONCEPTS
──────────────────────────────
  See inline comments marked with [📘 CONCEPT:] throughout this file.
  Topics covered:
    • Feature Engineering (lag features, rolling stats, cyclical encoding)
    • Time-Series Cross-Validation & why it differs from k-fold
    • Bias–Variance Tradeoff (Ridge vs Random Forest vs Gradient Boosting)
    • Class Imbalance (storms are rare) and how to handle it
    • Evaluation Metrics: RMSE, MAE, R², F1-score, Confusion Matrix
    • Feature Importance (MDI) in tree-based models
"""

import warnings
warnings.filterwarnings("ignore")

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import seaborn as sns
import requests

from datetime import datetime, timedelta

# ── scikit-learn ───────────────────────────────────────────────────────────────
from sklearn.model_selection import (
    train_test_split,
    cross_val_score,
    TimeSeriesSplit,
)
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.linear_model import Ridge
from sklearn.ensemble import (
    RandomForestRegressor,
    RandomForestClassifier,
    GradientBoostingRegressor,
    GradientBoostingClassifier,
)
from sklearn.svm import SVR, SVC
from sklearn.metrics import (
    mean_squared_error,
    mean_absolute_error,
    r2_score,
    classification_report,
    confusion_matrix,
    ConfusionMatrixDisplay,
    f1_score,
)

# ══════════════════════════════════════════════════════════════════════════════
#  CONSTANTS
# ══════════════════════════════════════════════════════════════════════════════

IOWA_CITY_LAT  = 41.6611
IOWA_CITY_LON  = -91.5302
IOWA_CITY_NAME = "Iowa City, IA 52246"

# ══════════════════════════════════════════════════════════════════════════════
#  STEP 1 — DATA COLLECTION
# ══════════════════════════════════════════════════════════════════════════════

def fetch_weather_data(
    start_date: str = "2010-01-01",
    end_date:   str = None,
    lat:        float = IOWA_CITY_LAT,
    lon:        float = IOWA_CITY_LON,
) -> pd.DataFrame:
    """
    Download historical daily weather data from Open-Meteo's archive API.

    [📘 CONCEPT: Reanalysis Data]
        ERA5 reanalysis is NOT raw station measurements. Instead, ECMWF runs a
        global atmospheric model, assimilates billions of observations (radar,
        satellite, weather balloons, surface stations), and produces a spatially
        complete, physically consistent estimate of the atmosphere at every
        grid point on Earth (~31 km resolution). This means we always get
        a value for Iowa City even on days with missing station data.

    Parameters
    ----------
    start_date : str   'YYYY-MM-DD' — beginning of data window
    end_date   : str   'YYYY-MM-DD' — defaults to yesterday
    lat, lon   : float  geographic coordinates

    Returns
    -------
    pd.DataFrame  indexed by date, one row per day
    """
    if end_date is None:
        end_date = (datetime.today() - timedelta(days=1)).strftime("%Y-%m-%d")

    print(f"\n{'─'*60}")
    print(f"📡  Fetching weather data for {IOWA_CITY_NAME}")
    print(f"    Period: {start_date}  →  {end_date}")
    print(f"{'─'*60}")

    url = "https://archive-api.open-meteo.com/v1/archive"

    # [📘 CONCEPT: Weather Variables]
    #   temperature_2m_*        — air temp 2 m above ground (standard met height)
    #   apparent_temperature_*  — "feels like" (wind-chill / heat-index adjusted)
    #   precipitation_sum       — total liquid + liquid-equivalent snowfall
    #   rain_sum / snowfall_sum — split by phase (liquid vs frozen)
    #   precipitation_hours     — how many hours of precip in the day
    #   windspeed_10m_max       — peak 10-m wind (standard anemometer height)
    #   windgusts_10m_max       — highest 3-second gust
    #   shortwave_radiation_sum — total incoming solar energy (MJ/m²)
    #   et0_fao_evapotranspiration — reference crop water demand (agrometeorology)
    #   weather_code            — WMO WW code (see WMO_STORM_MAP below)
    params = {
        "latitude":  lat,
        "longitude": lon,
        "start_date": start_date,
        "end_date":   end_date,
        "daily": [
            "temperature_2m_max",
            "temperature_2m_min",
            "temperature_2m_mean",
            "apparent_temperature_max",
            "apparent_temperature_min",
            "precipitation_sum",
            "rain_sum",
            "snowfall_sum",
            "precipitation_hours",
            "windspeed_10m_max",
            "windgusts_10m_max",
            "winddirection_10m_dominant",
            "shortwave_radiation_sum",
            "et0_fao_evapotranspiration",
            "weather_code",
        ],
        "timezone":            "America/Chicago",
        "temperature_unit":    "fahrenheit",
        "windspeed_unit":      "mph",
        "precipitation_unit":  "inch",
    }

    response = requests.get(url, params=params, timeout=30)
    response.raise_for_status()
    raw = response.json()["daily"]

    df = pd.DataFrame(raw)
    df["time"] = pd.to_datetime(df["time"])
    df.set_index("time", inplace=True)
    df.index.name = "date"

    missing = df.isnull().sum()
    if missing.any():
        print(f"    ⚠️  Missing values per column:\n{missing[missing > 0]}")

    print(f"    ✅  Retrieved {len(df):,} days  "
          f"({df.index[0].date()} → {df.index[-1].date()})")
    print(f"    📐  Shape: {df.shape[0]} rows × {df.shape[1]} columns\n")
    return df


# ══════════════════════════════════════════════════════════════════════════════
#  STEP 2 — WMO STORM CLASSIFICATION SCHEMA
# ══════════════════════════════════════════════════════════════════════════════

# [📘 CONCEPT: WMO Weather Codes]
#   The World Meteorological Organization (WMO) defines a standard set of
#   "present weather" (WW) codes used globally in METAR aviation reports,
#   synoptic station observations, and reanalysis products.
#
#   Code ranges and their physical meaning:
#     0        Clear sky
#     1–3      Partial cloud cover
#     45, 48   Fog (48 = depositing rime ice)
#     51–55    Drizzle (light → moderate → dense)
#     56–57    Freezing drizzle
#     61–65    Rain (slight → moderate → heavy)
#     66–67    Freezing rain (forms ice on surfaces — road hazard)
#     71–75    Snowfall (slight → moderate → heavy)
#     77       Snow grains (ice crystals)
#     80–82    Rain showers (slight → moderate → violent)
#     85–86    Snow showers (slight → heavy)
#     95       Thunderstorm (slight/moderate, no hail)
#     96       Thunderstorm with slight hail
#     99       Thunderstorm with heavy hail

WMO_STORM_MAP = {
    "Clear / Cloudy": list(range(0, 4)),
    "Fog":            [45, 48],
    "Drizzle":        list(range(51, 58)),
    "Rain":           list(range(61, 66)),
    "Freezing Rain":  [66, 67],
    "Snow":           list(range(71, 78)),
    "Rain Showers":   list(range(80, 83)),
    "Snow Showers":   [85, 86],
    "Thunderstorm":   [95, 96, 99],
}

STORM_CATEGORIES = list(WMO_STORM_MAP.keys())


def classify_weather(code: int) -> str:
    """Map a WMO integer code → human-readable category string."""
    for label, codes in WMO_STORM_MAP.items():
        if int(code) in codes:
            return label
    return "Other"


# ══════════════════════════════════════════════════════════════════════════════
#  STEP 3 — FEATURE ENGINEERING
# ══════════════════════════════════════════════════════════════════════════════

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Transform raw daily weather measurements into a rich feature matrix.

    [📘 CONCEPT: Feature Engineering]
        Raw sensor readings rarely feed directly into ML models. Feature
        engineering creates new variables that help the algorithm find
        patterns more easily. For weather time-series, four techniques are
        especially important:

        ① LAG FEATURES
          Yesterday's temperature is the single best predictor of today's.
          This is called autocorrelation. We create lags at 1, 2, 3, 7, 14
          days to capture short-term memory in the atmosphere.

        ② ROLLING STATISTICS
          A 7-day rolling average smooths out day-to-day noise and captures
          the "recent trend." A 30-day rolling sum of precipitation captures
          soil moisture state (important for convective storm initiation).

        ③ CYCLICAL ENCODING OF DAY-OF-YEAR
          If we simply feed day_of_year = 1…365 as a numeric feature, the
          model sees Dec 31 (day 365) and Jan 1 (day 1) as 364 steps apart —
          but they are physically adjacent. Sine + cosine encoding maps the
          calendar to a circle:
              sin_doy = sin(2π × doy / 365.25)
              cos_doy = cos(2π × doy / 365.25)
          Now Jan 1 and Dec 31 are close in (sin, cos) space. ✓

        ④ INTERACTION TERMS
          wind_speed × precipitation ≈ proxy for storm intensity.
          temperature × precipitation captures phase (snow vs rain boundary).

    Parameters
    ----------
    df : pd.DataFrame   raw daily weather DataFrame from fetch_weather_data()

    Returns
    -------
    pd.DataFrame  copy of df with engineered columns appended
    """
    df = df.copy()

    # ── Derived temperature metrics ───────────────────────────────────────────
    df["temp_range"]       = df["temperature_2m_max"]      - df["temperature_2m_min"]
    df["feels_like_range"] = df["apparent_temperature_max"] - df["apparent_temperature_min"]

    # ── Lag features (autocorrelation) ────────────────────────────────────────
    for lag in [1, 2, 3, 7, 14]:
        df[f"temp_mean_lag{lag}"]  = df["temperature_2m_mean"].shift(lag)
        df[f"precip_lag{lag}"]     = df["precipitation_sum"].shift(lag)
        df[f"windspeed_lag{lag}"]  = df["windspeed_10m_max"].shift(lag)

    # ── Rolling statistics (trend capture) ────────────────────────────────────
    for window in [3, 7, 14, 30]:
        df[f"temp_roll{window}"]      = df["temperature_2m_mean"].rolling(window).mean()
        df[f"precip_roll{window}"]    = df["precipitation_sum"].rolling(window).sum()
        df[f"windspeed_roll{window}"] = df["windspeed_10m_max"].rolling(window).mean()

    # ── Cyclical time encoding ────────────────────────────────────────────────
    doy = df.index.dayofyear
    df["sin_doy"] = np.sin(2 * np.pi * doy / 365.25)
    df["cos_doy"] = np.cos(2 * np.pi * doy / 365.25)

    df["month"]       = df.index.month
    df["year"]        = df.index.year
    df["day_of_week"] = df.index.dayofweek   # Monday=0, Sunday=6

    # ── Iowa season labels (for visualization/grouping) ───────────────────────
    season_map = {
        12: "Winter", 1: "Winter",  2: "Winter",
        3:  "Spring", 4: "Spring",  5: "Spring",
        6:  "Summer", 7: "Summer",  8: "Summer",
        9:  "Fall",   10: "Fall",   11: "Fall",
    }
    df["season"] = df.index.month.map(season_map)

    # One-hot encode seasons for use as numeric model features
    season_dummies = pd.get_dummies(df["season"], prefix="season", drop_first=False)
    df = pd.concat([df, season_dummies], axis=1)

    # ── Interaction terms ─────────────────────────────────────────────────────
    df["wind_x_precip"]  = df["windspeed_10m_max"] * df["precipitation_sum"]
    df["temp_x_precip"]  = df["temperature_2m_mean"] * df["precipitation_sum"]

    # ── Binary precipitation flag ─────────────────────────────────────────────
    df["precip_flag"] = (df["precipitation_sum"] > 0.01).astype(int)

    # ── Storm category label ──────────────────────────────────────────────────
    df["storm_category"] = df["weather_code"].apply(classify_weather)

    return df


# ══════════════════════════════════════════════════════════════════════════════
#  STEP 4 — THE PREDICTOR CLASS
# ══════════════════════════════════════════════════════════════════════════════

class IowaWeatherPredictor:
    """
    End-to-end weather prediction pipeline for Iowa City, IA.

    [📘 CONCEPT: The ML Pipeline]
        A standard supervised ML workflow has these stages:
          Data → Preprocessing → Feature Engineering → Model Training
          → Cross-Validation → Hyperparameter Tuning → Evaluation → Inference

        This class encapsulates all stages for:
          • Regression   (predicting continuous values like temperature)
          • Classification (predicting discrete labels like storm type)

    Attributes
    ----------
    df_raw   : pd.DataFrame  original fetched data (unmodified)
    df       : pd.DataFrame  feature-engineered data
    results  : dict          stores metrics + predictions from each run
    models   : dict          stores the best-trained model per task
    """

    def __init__(self, df: pd.DataFrame):
        self.df_raw = df
        self.df     = engineer_features(df)
        self.results = {}
        self.models  = {}

        print(f"📊  Feature matrix built: {self.df.shape[0]:,} rows × {self.df.shape[1]} columns")
        numeric_cols = [c for c in self.df.columns
                        if self.df[c].dtype in [np.float64, np.int64, bool, np.uint8]]
        print(f"    Numeric features available: {len(numeric_cols)}")

    # ─────────────────────────────────────────────────────────────────────────
    #  4A  REGRESSION — Next-Day Temperature & Precipitation
    # ─────────────────────────────────────────────────────────────────────────

    def build_regression_models(
        self,
        target_col: str = "temperature_2m_max",
        horizon:    int = 1,
    ) -> dict:
        """
        Train and compare regression models for a weather forecast target.

        [📘 CONCEPT: Regression vs Classification]
            Regression predicts a CONTINUOUS number (e.g., 72.4°F).
            Classification predicts a DISCRETE CATEGORY (e.g., "Thunderstorm").
            Most weather forecast problems are regression at heart
            (temperature, wind speed, precip amount), but can be turned into
            classification by bucketing (e.g., "high precip" vs "low precip").

        [📘 CONCEPT: The Four Regressors Compared]
            ┌─────────────────────┬──────────────────────────────────────────┐
            │ Ridge Regression    │ Linear model, adds L2 penalty to prevent │
            │                     │ overfitting. Fast. Interpretable.        │
            │                     │ Assumes linear relationships.            │
            ├─────────────────────┼──────────────────────────────────────────┤
            │ Random Forest       │ Ensemble of many decision trees.         │
            │                     │ Each tree trained on a random sample of  │
            │                     │ data (bootstrap) and random features.    │
            │                     │ Final answer = average of all trees.     │
            │                     │ Robust, handles non-linearity well.      │
            ├─────────────────────┼──────────────────────────────────────────┤
            │ Gradient Boosting   │ Builds trees SEQUENTIALLY — each tree    │
            │                     │ corrects errors of the previous ones.    │
            │                     │ Often highest accuracy but prone to      │
            │                     │ overfitting; needs careful tuning.       │
            ├─────────────────────┼──────────────────────────────────────────┤
            │ SVR                 │ Finds a hyperplane that fits points      │
            │                     │ within an ε-margin. Kernel trick maps    │
            │                     │ data to higher-dimensional space.        │
            │                     │ Powerful but slow on large datasets.     │
            └─────────────────────┴──────────────────────────────────────────┘

        [📘 CONCEPT: TimeSeriesSplit Cross-Validation]
            Standard k-fold CV randomly shuffles all data, which would let
            a model "see" Jan 2025 data while predicting Dec 2024 — this is
            called DATA LEAKAGE and produces inflated, unrealistic scores.

            TimeSeriesSplit creates folds that always keep time order intact:
              Fold 1: Train [2010–2011], Test [2012]
              Fold 2: Train [2010–2012], Test [2013]
              ...
            This mimics real forecasting: you can only train on the past.

        [📘 CONCEPT: Evaluation Metrics for Regression]
            RMSE  = √mean((ŷ - y)²)  — penalizes large errors heavily (°F)
            MAE   = mean(|ŷ - y|)    — average absolute error (°F), interpretable
            R²    = 1 - SS_res/SS_tot — fraction of variance explained (0–1)
                    R² = 0.90 means model explains 90% of temperature variance

        Parameters
        ----------
        target_col : str  column to forecast (temperature_2m_max, etc.)
        horizon    : int  days ahead (1 = tomorrow)
        """
        print(f"\n{'═'*60}")
        print(f"  REGRESSION  →  {target_col}  ({horizon}-day horizon)")
        print(f"{'═'*60}")

        df = self.df.dropna().copy()

        # Create the forecast target: shift series backward by `horizon` days
        # so row t gets the value from row t+horizon as its label
        y = df[target_col].shift(-horizon)
        valid = ~y.isna()
        y  = y[valid]
        df = df[valid]

        # Columns to EXCLUDE from features (raw targets & non-numeric labels)
        # [📘 CONCEPT: Preventing Data Leakage]
        #   We must remove ALL variables that would only be known AFTER the
        #   forecast horizon. E.g., tomorrow's temperature is the target —
        #   we can't include it as a feature!
        exclude = {
            "temperature_2m_max", "temperature_2m_min", "temperature_2m_mean",
            "apparent_temperature_max", "apparent_temperature_min",
            "precipitation_sum", "rain_sum", "snowfall_sum",
            "weather_code", "storm_category", "season",
        }

        numeric_dtypes = [np.float64, np.int64, bool, np.uint8]
        feature_cols = [
            c for c in df.columns
            if c not in exclude and df[c].dtype in numeric_dtypes
        ]

        X = df[feature_cols]

        # ── Train / Test split (temporal — last 20% is test set) ──────────────
        split_n    = int(len(X) * 0.80)
        X_train    = X.iloc[:split_n]
        X_test     = X.iloc[split_n:]
        y_train    = y.iloc[:split_n]
        y_test     = y.iloc[split_n:]

        print(f"  Train: {len(X_train):,} days  |  Test: {len(X_test):,} days")
        print(f"  Features: {len(feature_cols)}")
        print(f"  Test window: {X_test.index[0].date()} → {X_test.index[-1].date()}")

        # ── Standardise features ──────────────────────────────────────────────
        # [📘 CONCEPT: Feature Scaling]
        #   Ridge and SVR are sensitive to feature scale (e.g., solar radiation
        #   is 0–30 MJ/m² while temperature is -20 to 100°F). Without scaling,
        #   large-magnitude features dominate the model.
        #   StandardScaler: x_scaled = (x - μ) / σ → mean=0, std=1
        #   Tree-based models (RF, GB) are scale-invariant, so they use raw X.
        scaler = StandardScaler()
        X_train_sc = scaler.fit_transform(X_train)   # fit ONLY on training data
        X_test_sc  = scaler.transform(X_test)         # transform test with same params

        models_def = {
            "Ridge Regression":  Ridge(alpha=1.0),
            "Random Forest":     RandomForestRegressor(
                                     n_estimators=300, max_depth=12,
                                     min_samples_leaf=3, random_state=42, n_jobs=-1),
            "Gradient Boosting": GradientBoostingRegressor(
                                     n_estimators=200, learning_rate=0.05,
                                     max_depth=5, subsample=0.8, random_state=42),
            "SVR":               SVR(kernel="rbf", C=10, epsilon=0.5),
        }

        NEEDS_SCALE = {"Ridge Regression", "SVR"}
        tscv = TimeSeriesSplit(n_splits=5)

        reg_results = {}
        for name, model in models_def.items():
            tr = X_train_sc if name in NEEDS_SCALE else X_train.values
            te = X_test_sc  if name in NEEDS_SCALE else X_test.values

            cv_r2 = cross_val_score(
                model, tr, y_train, cv=tscv, scoring="r2", n_jobs=-1
            )
            model.fit(tr, y_train)
            y_pred = model.predict(te)

            rmse = np.sqrt(mean_squared_error(y_test, y_pred))
            mae  = mean_absolute_error(y_test, y_pred)
            r2   = r2_score(y_test, y_pred)

            reg_results[name] = {
                "model":      model,
                "y_pred":     y_pred,
                "rmse":       rmse,
                "mae":        mae,
                "r2":         r2,
                "cv_r2_mean": cv_r2.mean(),
                "cv_r2_std":  cv_r2.std(),
            }

            print(f"\n  [{name}]")
            print(f"    RMSE : {rmse:6.3f} °F")
            print(f"    MAE  : {mae:6.3f} °F")
            print(f"    R²   : {r2:7.4f}")
            print(f"    CV R² (5-fold TimeSeriesSplit): "
                  f"{cv_r2.mean():.4f} ± {cv_r2.std():.4f}")

        best = min(reg_results, key=lambda k: reg_results[k]["rmse"])
        print(f"\n  🏆  Best model: {best}  (RMSE = {reg_results[best]['rmse']:.3f} °F)")

        key = f"reg_{target_col}"
        self.results[key] = {
            "models":       reg_results,
            "X_test":       X_test,
            "y_test":       y_test,
            "feature_cols": feature_cols,
            "scaler":       scaler,
        }
        self.models[key] = reg_results[best]["model"]

        return reg_results

    # ─────────────────────────────────────────────────────────────────────────
    #  4B  CLASSIFICATION — Storm Type Prediction
    # ─────────────────────────────────────────────────────────────────────────

    def build_classification_models(self) -> dict:
        """
        Train and compare storm-type classifiers.

        [📘 CONCEPT: Multi-Class Classification]
            Instead of one label (binary), we predict one of N storm categories.
            scikit-learn handles this automatically with "one-vs-rest" (OvR) or
            "one-vs-one" (OvO) strategies under the hood.

        [📘 CONCEPT: Class Imbalance — the biggest pitfall in storm prediction]
            Iowa City has ~365 days/year. Distribution roughly:
              Clear days   : ~200 days  (55%)
              Rain         :  ~60 days  (16%)
              Snow         :  ~30 days   (8%)
              Thunderstorms:  ~25 days   (7%)
              Other types  :  ~50 days  (14%)

            A naive model that ALWAYS predicts "Clear" would score 55% accuracy —
            and be completely useless for storm prediction!

            Fix: class_weight='balanced' computes weights inversely proportional
            to class frequency:
                weight_c = n_samples / (n_classes × count_c)
            Rare storm classes get higher weight → the loss function penalises
            misclassifying a thunderstorm much more than misclassifying a clear day.

        [📘 CONCEPT: Evaluation Metrics for Classification]
            Accuracy  : (TP + TN) / all   — misleading with imbalanced classes
            Precision : TP / (TP + FP)    — "when it says storm, is it right?"
            Recall    : TP / (TP + FN)    — "of all real storms, how many caught?"
            F1-Score  : 2 × P × R / (P+R) — harmonic mean; good for imbalanced data
            Weighted F1: averages F1 per class, weighted by class support (count)
        """
        print(f"\n{'═'*60}")
        print(f"  CLASSIFICATION  →  Storm Type Prediction")
        print(f"{'═'*60}")

        df = self.df.dropna().copy()
        df = df[df["storm_category"] != "Other"]

        # ── Class distribution ────────────────────────────────────────────────
        print("\n  Storm category distribution in dataset:")
        dist = df["storm_category"].value_counts()
        total = len(df)
        for cat, cnt in dist.items():
            pct = cnt / total * 100
            bar = "█" * max(1, int(pct / 2.5))
            print(f"  {cat:<18} {cnt:5,d}  ({pct:5.1f}%)  {bar}")

        exclude = {
            "temperature_2m_max", "temperature_2m_min", "temperature_2m_mean",
            "apparent_temperature_max", "apparent_temperature_min",
            "weather_code", "storm_category", "season",
        }
        numeric_dtypes = [np.float64, np.int64, bool, np.uint8]
        feature_cols = [
            c for c in df.columns
            if c not in exclude and df[c].dtype in numeric_dtypes
        ]

        X   = df[feature_cols]
        y   = df["storm_category"]

        le     = LabelEncoder()
        y_enc  = le.fit_transform(y)

        split_n    = int(len(X) * 0.80)
        X_train    = X.iloc[:split_n]
        X_test     = X.iloc[split_n:]
        y_train    = y_enc[:split_n]
        y_test     = y_enc[split_n:]

        print(f"\n  Train: {len(X_train):,}  |  Test: {len(X_test):,}")
        print(f"  Classes: {list(le.classes_)}")

        scaler     = StandardScaler()
        X_train_sc = scaler.fit_transform(X_train)
        X_test_sc  = scaler.transform(X_test)

        models_def = {
            "Random Forest":     RandomForestClassifier(
                                     n_estimators=300, class_weight="balanced",
                                     max_depth=12, random_state=42, n_jobs=-1),
            "Gradient Boosting": GradientBoostingClassifier(
                                     n_estimators=150, learning_rate=0.1,
                                     max_depth=5, random_state=42),
            "SVC":               SVC(kernel="rbf", C=10,
                                     class_weight="balanced", probability=True),
        }

        NEEDS_SCALE = {"SVC"}
        tscv        = TimeSeriesSplit(n_splits=5)
        clf_results = {}

        for name, model in models_def.items():
            tr = X_train_sc if name in NEEDS_SCALE else X_train.values
            te = X_test_sc  if name in NEEDS_SCALE else X_test.values

            cv_f1 = cross_val_score(
                model, tr, y_train, cv=tscv, scoring="f1_weighted", n_jobs=-1
            )
            model.fit(tr, y_train)
            y_pred = model.predict(te)
            f1 = f1_score(y_test, y_pred, average="weighted")

            clf_results[name] = {
                "model":      model,
                "y_pred":     y_pred,
                "f1_weighted": f1,
                "cv_f1_mean":  cv_f1.mean(),
                "cv_f1_std":   cv_f1.std(),
            }

            print(f"\n  [{name}]")
            print(f"    Weighted F1 : {f1:.4f}")
            print(f"    CV F1 (5-fold): {cv_f1.mean():.4f} ± {cv_f1.std():.4f}")
            print(classification_report(
                y_test, y_pred,
                target_names=le.classes_,
                zero_division=0,
            ))

        best = max(clf_results, key=lambda k: clf_results[k]["f1_weighted"])
        print(f"\n  🏆  Best classifier: {best}  (F1 = {clf_results[best]['f1_weighted']:.4f})")

        self.results["classification"] = {
            "models":        clf_results,
            "X_test":        X_test,
            "y_test":        y_test,
            "feature_cols":  feature_cols,
            "label_encoder": le,
            "scaler":        scaler,
        }
        self.models["classification"] = clf_results[best]["model"]

        return clf_results

    # ─────────────────────────────────────────────────────────────────────────
    #  4C  VISUALIZATIONS
    # ─────────────────────────────────────────────────────────────────────────

    def plot_temperature_trends(self):
        """
        Four-panel temperature analysis chart for Iowa City.

        Panels:
          ① Daily high/low shaded band + 30-day rolling mean
          ② Monthly temperature box plots (seasonal spread)
          ③ Year-over-year mean temperature trend (with linear trend line)
          ④ Year × Month temperature heatmap

        [📘 CONCEPT: Rolling Statistics in Visualization]
            A 30-day rolling mean is a low-pass filter — it removes high-
            frequency (day-to-day) noise and reveals the seasonal signal.
            This is the same technique used in climate analysis to separate
            "weather" (days) from "climate" (months, years).
        """
        fig, axes = plt.subplots(2, 2, figsize=(16, 10))
        fig.suptitle(
            f"Temperature Patterns — {IOWA_CITY_NAME}",
            fontsize=16, fontweight="bold", y=1.01
        )

        df   = self.df_raw.copy()
        df["month"] = df.index.month
        df["year"]  = df.index.year

        # ① Daily high/low band + rolling mean ────────────────────────────────
        ax = axes[0, 0]
        ax.fill_between(
            df.index,
            df["temperature_2m_min"],
            df["temperature_2m_max"],
            alpha=0.25, color="steelblue", label="Daily Min–Max Range"
        )
        roll30 = df["temperature_2m_mean"].rolling(30, center=True).mean()
        ax.plot(df.index, roll30, color="crimson", linewidth=1.5, label="30-day Rolling Mean")
        ax.set_title("① Daily Temperature Range")
        ax.set_ylabel("Temperature (°F)")
        ax.legend(fontsize=8)
        ax.xaxis.set_major_formatter(mdates.DateFormatter("%Y"))
        ax.xaxis.set_major_locator(mdates.YearLocator(2))
        plt.setp(ax.xaxis.get_majorticklabels(), rotation=45)

        # ② Monthly box plots ─────────────────────────────────────────────────
        ax = axes[0, 1]
        monthly_data = [
            df[df["month"] == m]["temperature_2m_mean"].dropna().values
            for m in range(1, 13)
        ]
        bp = ax.boxplot(monthly_data, patch_artist=True, notch=False)
        palette = plt.cm.RdYlBu_r(np.linspace(0.1, 0.9, 12))
        for patch, color in zip(bp["boxes"], palette):
            patch.set_facecolor(color)
            patch.set_alpha(0.8)
        ax.set_xticklabels(
            ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
            fontsize=8
        )
        ax.set_title("② Monthly Temperature Distribution")
        ax.set_ylabel("Mean Temperature (°F)")
        ax.axhline(32, color="blue", linestyle="--", linewidth=0.8, alpha=0.6, label="Freezing (32°F)")
        ax.legend(fontsize=8)

        # ③ Annual trend ───────────────────────────────────────────────────────
        ax = axes[1, 0]
        annual = df.groupby("year")["temperature_2m_mean"].mean()
        ax.bar(annual.index, annual.values, color="steelblue", alpha=0.65, zorder=2)
        z = np.polyfit(annual.index, annual.values, 1)
        p = np.poly1d(z)
        trend_label = f"Trend: {z[0]:+.3f}°F / yr"
        ax.plot(annual.index, p(annual.index), "r--", linewidth=2.0, label=trend_label, zorder=3)
        ax.set_title("③ Annual Mean Temperature Trend")
        ax.set_ylabel("Mean Temperature (°F)")
        ax.legend(fontsize=9)
        ax.grid(axis="y", alpha=0.3)

        # ④ Year × Month heatmap ───────────────────────────────────────────────
        ax = axes[1, 1]
        pivot = df.pivot_table(
            values="temperature_2m_mean",
            index="year", columns="month", aggfunc="mean"
        )
        sns.heatmap(
            pivot, ax=ax, cmap="RdYlBu_r", annot=False, fmt=".0f",
            xticklabels=["Jan","Feb","Mar","Apr","May","Jun",
                         "Jul","Aug","Sep","Oct","Nov","Dec"],
            cbar_kws={"label": "°F"}
        )
        ax.set_title("④ Temperature Heatmap (Year × Month)")
        ax.set_ylabel("Year")

        plt.tight_layout()
        out = "temperature_trends.png"
        plt.savefig(out, dpi=150, bbox_inches="tight")
        print(f"  💾  Saved: {out}")
        plt.show()

    def plot_storm_frequency(self):
        """
        Three-panel storm frequency and seasonality analysis.

        Panels:
          ① Horizontal bar — total event counts per storm category
          ② Heatmap — storm events by category × month (seasonality)
          ③ Stacked bar — annual storm event counts (trend over time)

        [📘 CONCEPT: Climatology vs Forecast]
            This chart shows CLIMATOLOGY — the long-run statistical
            distribution of weather events. Before building any forecast
            model, understanding climatology is essential:
              • It defines your baseline (climatological mean forecast)
              • It reveals class imbalance (thunderstorms are rare)
              • It shows seasonality that your features must capture
        """
        df         = self.df.copy().dropna(subset=["storm_category"])
        df["month"] = df.index.month
        df["year"]  = df.index.year

        storm_cats = [
            "Thunderstorm", "Rain", "Freezing Rain",
            "Snow", "Drizzle", "Rain Showers", "Snow Showers"
        ]

        fig, axes = plt.subplots(1, 3, figsize=(20, 7))
        fig.suptitle(
            f"Storm Frequency Analysis — {IOWA_CITY_NAME}",
            fontsize=15, fontweight="bold"
        )

        # ① Total frequency ────────────────────────────────────────────────────
        ax = axes[0]
        counts = df["storm_category"].value_counts()
        colors = plt.cm.tab10(np.linspace(0, 1, len(counts)))
        bars   = ax.barh(counts.index, counts.values, color=colors, edgecolor="white")
        ax.set_title("① Total Event Frequency")
        ax.set_xlabel("Number of Days (2010–Present)")
        for bar, val in zip(bars, counts.values):
            ax.text(
                bar.get_width() + max(counts.values) * 0.01,
                bar.get_y() + bar.get_height() / 2,
                f"{val:,}", va="center", fontsize=9
            )
        ax.invert_yaxis()

        # ② Monthly seasonality heatmap ────────────────────────────────────────
        ax = axes[1]
        pivot = (
            df[df["storm_category"].isin(storm_cats)]
            .pivot_table(
                values="weather_code",
                index="storm_category",
                columns="month",
                aggfunc="count",
                fill_value=0,
            )
        )
        pivot.columns = ["Jan","Feb","Mar","Apr","May","Jun",
                         "Jul","Aug","Sep","Oct","Nov","Dec"]
        sns.heatmap(
            pivot, ax=ax, cmap="YlOrRd", annot=True, fmt="d",
            linewidths=0.5, cbar_kws={"shrink": 0.75, "label": "Days"}
        )
        ax.set_title("② Storm Events by Month")
        ax.set_xlabel("")
        ax.set_ylabel("")

        # ③ Annual storm counts ────────────────────────────────────────────────
        ax = axes[2]
        annual = (
            df[df["storm_category"].isin(storm_cats)]
            .groupby(["year", "storm_category"])
            .size()
            .unstack(fill_value=0)
        )
        annual.plot(kind="bar", ax=ax, stacked=True, colormap="tab10")
        ax.set_title("③ Annual Storm Event Counts")
        ax.set_xlabel("Year")
        ax.set_ylabel("Number of Events")
        ax.legend(fontsize=7, bbox_to_anchor=(1.01, 1), loc="upper left")
        ax.set_xticklabels(ax.get_xticklabels(), rotation=45, ha="right")

        plt.tight_layout()
        out = "storm_frequency.png"
        plt.savefig(out, dpi=150, bbox_inches="tight")
        print(f"  💾  Saved: {out}")
        plt.show()

    def plot_regression_comparison(self, target_col: str = "temperature_2m_max"):
        """
        2×2 scatter grid: predicted vs actual for all four regressors.

        [📘 CONCEPT: Residual Analysis]
            A perfect model has all points on the y=x diagonal.
            - Systematic curvature → model is missing non-linear relationships
            - Fan shape (wider spread at high values) → heteroscedasticity
            - Vertical clusters → the model struggles with certain regimes
              (e.g., extreme cold snaps or heat waves)
        """
        key = f"reg_{target_col}"
        if key not in self.results:
            print(f"  Run build_regression_models('{target_col}') first.")
            return

        res    = self.results[key]
        y_test = res["y_test"]
        models = res["models"]

        fig, axes = plt.subplots(2, 2, figsize=(14, 10))
        fig.suptitle(
            f"Regression Model Comparison — Next-Day {target_col}",
            fontsize=14, fontweight="bold"
        )

        color_map = {
            "Ridge Regression":  "#4E79A7",
            "Random Forest":     "#F28E2B",
            "Gradient Boosting": "#E15759",
            "SVR":               "#76B7B2",
        }

        for idx, (name, rm) in enumerate(models.items()):
            ax     = axes[idx // 2][idx % 2]
            y_pred = rm["y_pred"]
            lo     = min(y_test.min(), y_pred.min()) - 2
            hi     = max(y_test.max(), y_pred.max()) + 2

            ax.scatter(y_test, y_pred, alpha=0.35, s=8,
                       color=color_map.get(name, "gray"), rasterized=True)
            ax.plot([lo, hi], [lo, hi], "k--", linewidth=1.2, label="Perfect")
            ax.set_xlim(lo, hi)
            ax.set_ylim(lo, hi)
            ax.set_xlabel("Actual (°F)")
            ax.set_ylabel("Predicted (°F)")
            ax.set_title(
                f"{name}\n"
                f"RMSE={rm['rmse']:.2f}°F   MAE={rm['mae']:.2f}°F   R²={rm['r2']:.3f}"
            )
            ax.legend(fontsize=8)
            ax.set_aspect("equal", adjustable="box")

        plt.tight_layout()
        out = f"regression_comparison_{target_col}.png"
        plt.savefig(out, dpi=150, bbox_inches="tight")
        print(f"  💾  Saved: {out}")
        plt.show()

    def plot_feature_importance(self, model_key: str = "reg_temperature_2m_max"):
        """
        Horizontal bar chart of top-20 feature importances from Random Forest.

        [📘 CONCEPT: Mean Decrease in Impurity (MDI)]
            Tree-based models split nodes to minimise impurity (variance for
            regression, Gini/entropy for classification). Feature importance
            = total impurity reduction attributed to each feature across all
            trees, normalised to sum to 1.

            High importance → the model relies heavily on that feature.
            Low importance  → the feature contributes little predictive power.

            Watch-out: MDI can overrate high-cardinality features. For thesis
            work, complement with permutation importance (sklearn.inspection).
        """
        if model_key not in self.results:
            print(f"  No results for '{model_key}'.")
            return

        res = self.results[model_key]
        # Find a tree-based model
        tree_model = (
            res["models"].get("Random Forest") or
            res["models"].get("Gradient Boosting")
        )
        if tree_model is None:
            print("  No tree-based model found in results.")
            return

        importances  = tree_model["model"].feature_importances_
        feature_cols = res["feature_cols"]

        fi = (
            pd.DataFrame({"feature": feature_cols, "importance": importances})
            .sort_values("importance", ascending=False)
            .head(20)
        )

        fig, ax = plt.subplots(figsize=(10, 7))
        bars = ax.barh(
            fi["feature"][::-1], fi["importance"][::-1],
            color=plt.cm.viridis(np.linspace(0.2, 0.8, len(fi)))
        )
        ax.set_title(
            f"Top-20 Feature Importances — Random Forest\n({model_key})",
            fontsize=13, fontweight="bold"
        )
        ax.set_xlabel("Importance (Mean Decrease in Impurity)")
        ax.grid(axis="x", alpha=0.3)
        plt.tight_layout()
        out = f"feature_importance_{model_key}.png"
        plt.savefig(out, dpi=150, bbox_inches="tight")
        print(f"  💾  Saved: {out}")
        plt.show()

    def plot_confusion_matrix(self):
        """
        Confusion matrix for the best storm classification model.

        [📘 CONCEPT: Confusion Matrix]
            Rows = actual class.  Columns = predicted class.
            Diagonal = correct predictions.  Off-diagonal = errors.

            For storm forecasting:
              • High Recall for "Thunderstorm" = few missed storms (critical
                for public safety warnings)
              • High Precision for "Thunderstorm" = few false alarms
              • You often trade Recall vs Precision by adjusting decision
                thresholds — a choice driven by the cost of each error type
        """
        if "classification" not in self.results:
            print("  Run build_classification_models() first.")
            return

        res  = self.results["classification"]
        le   = res["label_encoder"]
        best = max(res["models"], key=lambda k: res["models"][k]["f1_weighted"])
        y_pred = res["models"][best]["y_pred"]
        y_test = res["y_test"]

        cm = confusion_matrix(y_test, y_pred)
        fig, ax = plt.subplots(figsize=(11, 9))
        disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=le.classes_)
        disp.plot(ax=ax, colorbar=True, cmap="Blues", xticks_rotation=45)
        ax.set_title(
            f"Storm Classification — Confusion Matrix\n({best})",
            fontsize=13, fontweight="bold"
        )
        plt.tight_layout()
        out = "confusion_matrix_storms.png"
        plt.savefig(out, dpi=150, bbox_inches="tight")
        print(f"  💾  Saved: {out}")
        plt.show()

    def plot_precipitation_calendar(self):
        """
        Calendar-style heatmap of daily precipitation (like GitHub contributions).

        [📘 CONCEPT: Calendar Heatmaps]
            Visualising weather on a calendar reveals patterns not obvious
            in time-series plots:
              • Spring wet season (April–May)
              • Summer convective bursts (June–July)
              • Winter dry stretches punctuated by snow events
        """
        df = self.df_raw[["precipitation_sum"]].copy()
        df["year"]  = df.index.year
        df["month"] = df.index.month

        pivot = df.pivot_table(
            values="precipitation_sum",
            index="year",
            columns="month",
            aggfunc="sum",
        )
        pivot.columns = ["Jan","Feb","Mar","Apr","May","Jun",
                         "Jul","Aug","Sep","Oct","Nov","Dec"]

        fig, ax = plt.subplots(figsize=(14, 6))
        sns.heatmap(
            pivot, ax=ax, cmap="Blues", annot=True, fmt=".1f",
            linewidths=0.4, cbar_kws={"label": "Total Precip (in)"}
        )
        ax.set_title(
            f"Monthly Precipitation Totals — {IOWA_CITY_NAME}",
            fontsize=13, fontweight="bold"
        )
        ax.set_ylabel("Year")
        plt.tight_layout()
        out = "precipitation_calendar.png"
        plt.savefig(out, dpi=150, bbox_inches="tight")
        print(f"  💾  Saved: {out}")
        plt.show()

    # ─────────────────────────────────────────────────────────────────────────
    #  4D  SUMMARY TABLE
    # ─────────────────────────────────────────────────────────────────────────

    def print_summary(self):
        """Print a formatted summary table of all model results."""
        print(f"\n{'═'*70}")
        print(f"  MODEL PERFORMANCE SUMMARY  —  {IOWA_CITY_NAME}")
        print(f"{'═'*70}")

        # Regression results
        reg_keys = [k for k in self.results if k.startswith("reg_")]
        if reg_keys:
            print(f"\n  {'TASK':<35}  {'MODEL':<22}  {'RMSE':>6}  {'R²':>7}")
            print(f"  {'─'*35}  {'─'*22}  {'─'*6}  {'─'*7}")
            for rk in reg_keys:
                target = rk.replace("reg_", "")
                models = self.results[rk]["models"]
                best   = min(models, key=lambda k: models[k]["rmse"])
                rm     = models[best]
                print(f"  {target:<35}  {best:<22}  {rm['rmse']:6.3f}  {rm['r2']:7.4f}")

        # Classification results
        if "classification" in self.results:
            print(f"\n  {'TASK':<35}  {'MODEL':<22}  {'F1-W':>6}")
            print(f"  {'─'*35}  {'─'*22}  {'─'*6}")
            clf = self.results["classification"]
            best = max(clf["models"], key=lambda k: clf["models"][k]["f1_weighted"])
            f1   = clf["models"][best]["f1_weighted"]
            print(f"  {'Storm Type Classification':<35}  {best:<22}  {f1:6.4f}")

        print(f"\n{'═'*70}")

    # ─────────────────────────────────────────────────────────────────────────
    #  4E  FULL PIPELINE
    # ─────────────────────────────────────────────────────────────────────────

    def run_full_pipeline(self) -> "IowaWeatherPredictor":
        """
        Execute the entire weather prediction pipeline end-to-end.

        Order of operations:
          1. Regression: Max Temperature  (next-day)
          2. Regression: Min Temperature  (next-day)
          3. Regression: Precipitation    (next-day)
          4. Classification: Storm Type
          5. Plots: Temperature trends
          6. Plots: Storm frequency
          7. Plots: Precipitation calendar
          8. Plots: Regression comparison
          9. Plots: Feature importance
         10. Plots: Confusion matrix
         11. Summary table
        """
        print(f"\n{'█'*60}")
        print(f"  Iowa City Weather Prediction — Full Pipeline")
        print(f"  {IOWA_CITY_NAME}")
        print(f"{'█'*60}")

        # ── Regression ────────────────────────────────────────────────────────
        self.build_regression_models("temperature_2m_max", horizon=1)
        self.build_regression_models("temperature_2m_min", horizon=1)
        self.build_regression_models("precipitation_sum",  horizon=1)

        # ── Classification ────────────────────────────────────────────────────
        self.build_classification_models()

        # ── Visualisations ────────────────────────────────────────────────────
        print("\n📈  Generating visualizations ...")
        self.plot_temperature_trends()
        self.plot_storm_frequency()
        self.plot_precipitation_calendar()
        self.plot_regression_comparison("temperature_2m_max")
        self.plot_feature_importance("reg_temperature_2m_max")
        self.plot_confusion_matrix()

        # ── Summary ───────────────────────────────────────────────────────────
        self.print_summary()

        print("\n✅  Pipeline complete!")
        print("    All results stored in predictor.results")
        print("    All charts saved as .png in the working directory\n")

        return self


# ══════════════════════════════════════════════════════════════════════════════
#  ENTRY POINT
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":

    # ── 1. Fetch 15 years of Iowa City weather data ───────────────────────────
    df = fetch_weather_data(start_date="2010-01-01")

    # ── 2. Instantiate the predictor and run everything ───────────────────────
    predictor = IowaWeatherPredictor(df)
    predictor.run_full_pipeline()

    # ── 3. Quick example: access results programmatically ─────────────────────
    # reg_results = predictor.results["reg_temperature_2m_max"]
    # best_rf     = reg_results["models"]["Random Forest"]
    # print("RF test R²:", best_rf["r2"])
