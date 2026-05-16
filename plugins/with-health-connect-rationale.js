const fs = require("fs");
const path = require("path");
const {
  AndroidConfig,
  createRunOncePlugin,
  withAndroidManifest,
  withDangerousMod,
} = require("@expo/config-plugins");

const { getMainActivityOrThrow, getMainApplicationOrThrow } = AndroidConfig.Manifest;

const ACTION_SHOW_PERMISSIONS_RATIONALE = "androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE";
const ACTION_VIEW_PERMISSION_USAGE = "android.intent.action.VIEW_PERMISSION_USAGE";
const CATEGORY_HEALTH_PERMISSIONS = "android.intent.category.HEALTH_PERMISSIONS";
const START_VIEW_PERMISSION_USAGE = "android.permission.START_VIEW_PERMISSION_USAGE";
const RATIONALE_ACTIVITY = ".HealthConnectRationaleActivity";
const RATIONALE_ALIAS = "ViewPermissionUsageActivity";

function ensureArray(parent, key) {
  if (!Array.isArray(parent[key])) parent[key] = [];
  return parent[key];
}

function hasAction(intentFilter, actionName) {
  return intentFilter.action?.some((action) => action.$?.["android:name"] === actionName) ?? false;
}

function removeMainActivityHealthConnectRationaleFilter(androidManifest) {
  const mainActivity = getMainActivityOrThrow(androidManifest);
  const intentFilters = mainActivity["intent-filter"] ?? [];
  mainActivity["intent-filter"] = intentFilters.filter(
    (intentFilter) => !hasAction(intentFilter, ACTION_SHOW_PERMISSIONS_RATIONALE),
  );
}

function upsertHealthConnectRationaleActivity(mainApplication) {
  const activities = ensureArray(mainApplication, "activity");
  const existing = activities.find((activity) => activity.$?.["android:name"] === RATIONALE_ACTIVITY);
  const rationaleActivity = {
    $: {
      "android:name": RATIONALE_ACTIVITY,
      "android:exported": "true",
    },
    "intent-filter": [
      {
        action: [{ $: { "android:name": ACTION_SHOW_PERMISSIONS_RATIONALE } }],
      },
    ],
  };

  if (existing) {
    Object.assign(existing, rationaleActivity);
  } else {
    activities.push(rationaleActivity);
  }
}

function upsertHealthConnectRationaleAlias(mainApplication) {
  const aliases = ensureArray(mainApplication, "activity-alias");
  const nextAliases = aliases.filter((alias) => alias.$?.["android:name"] !== RATIONALE_ALIAS);
  nextAliases.push({
    $: {
      "android:name": RATIONALE_ALIAS,
      "android:exported": "true",
      "android:targetActivity": RATIONALE_ACTIVITY,
      "android:permission": START_VIEW_PERMISSION_USAGE,
    },
    "intent-filter": [
      {
        action: [{ $: { "android:name": ACTION_VIEW_PERMISSION_USAGE } }],
        category: [{ $: { "android:name": CATEGORY_HEALTH_PERMISSIONS } }],
      },
    ],
  });
  mainApplication["activity-alias"] = nextAliases;
}

function kotlinString(value) {
  return JSON.stringify(value).replace(/\$/g, "\\$");
}

function buildActivitySource(packageName, privacyPolicyUrl) {
  return `package ${packageName}

import android.app.Activity
import android.os.Bundle
import android.view.ViewGroup
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.LinearLayout
import android.widget.TextView

class HealthConnectRationaleActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    title = "Lagan privacy policy"

    val container = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      layoutParams = LinearLayout.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT,
      )
    }

    val header = TextView(this).apply {
      text = "Lagan uses Health Connect only to read steps and sleep data when you ask to sync them. This data updates your habit progress and sleep dashboard. Lagan does not sell Health Connect data or use it for advertising."
      textSize = 16f
      setPadding(32, 32, 32, 24)
    }

    val webView = WebView(this).apply {
      layoutParams = LinearLayout.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        0,
        1f,
      )
      settings.javaScriptEnabled = false
      settings.domStorageEnabled = false
      webViewClient = WebViewClient()
      loadUrl(PRIVACY_POLICY_URL)
    }

    container.addView(header)
    container.addView(webView)
    setContentView(container)
  }

  companion object {
    private const val PRIVACY_POLICY_URL = ${kotlinString(privacyPolicyUrl)}
  }
}
`;
}

function resolvePrivacyPolicyUrl(props) {
  return (
    props.privacyPolicyUrl ||
    process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL ||
    "https://lagan.health/privacy"
  );
}

const withHealthConnectRationale = (config, props = {}) => {
  const privacyPolicyUrl = resolvePrivacyPolicyUrl(props);

  config = withAndroidManifest(config, (config) => {
    const mainApplication = getMainApplicationOrThrow(config.modResults);
    removeMainActivityHealthConnectRationaleFilter(config.modResults);
    upsertHealthConnectRationaleActivity(mainApplication);
    upsertHealthConnectRationaleAlias(mainApplication);
    return config;
  });

  config = withDangerousMod(config, [
    "android",
    async (config) => {
      const packageName = config.android?.package;
      if (!packageName) {
        throw new Error("android.package is required for HealthConnectRationaleActivity");
      }

      const activityDir = path.join(
        config.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "java",
        ...packageName.split("."),
      );
      fs.mkdirSync(activityDir, { recursive: true });
      fs.writeFileSync(
        path.join(activityDir, "HealthConnectRationaleActivity.kt"),
        buildActivitySource(packageName, privacyPolicyUrl),
      );

      return config;
    },
  ]);

  return config;
};

module.exports = createRunOncePlugin(
  withHealthConnectRationale,
  "with-health-connect-rationale",
  "1.0.0",
);
