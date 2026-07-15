package com.lifelinepro.app;

import android.net.Uri;
import android.os.Bundle;
import com.google.androidbrowserhelper.trusted.LauncherActivity;

/**
 * Custom LauncherActivity that provides the launch URL.
 * The splash screen crash is avoided by not including
 * SPLASH_IMAGE_DRAWABLE meta-data in the manifest.
 */
public class Application extends LauncherActivity {

    @Override
    protected Uri getLaunchingUrl() {
        return Uri.parse("https://lifeline-pro-frontend.vercel.app/");
    }
}
