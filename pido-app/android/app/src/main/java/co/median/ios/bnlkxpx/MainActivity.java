package co.median.ios.bnlkxpx;

import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Status bar oscura
        getWindow().setStatusBarColor(0xFF0D0D0D);
        getWindow().setNavigationBarColor(0xFF0D0D0D);
        getWindow().getDecorView().setSystemUiVisibility(0);

        // Mantener pantalla encendida para tracking
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // Permitir audio sin interacción del usuario
        WebView webView = getBridge().getWebView();
        webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
    }
}
