package com.lifelinepro.app;

import android.net.Uri;
import com.google.androidbrowserhelper.trusted.LauncherActivity;

/**
 * Custom LauncherActivity that disables the splash screen strategy
 * to avoid the "width and height must be > 0" crash when the library
 * tries to convert a vector/layer-list drawable to a bitmap.
 */
public class Application extends LauncherActivity {

    @Override
    protected Uri getLaunchingUrl() {
        return Uri.parse("https://lifeline-pro-frontend.vercel.app/");
    }

    @Override
    protected boolean useSplashScreen() {
        return false;
    }
}
