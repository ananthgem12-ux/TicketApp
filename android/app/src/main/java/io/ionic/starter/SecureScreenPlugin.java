package io.ionic.starter;

import android.view.WindowManager;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SecureScreen")
public class SecureScreenPlugin extends Plugin {

    @PluginMethod
    public void enable(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try {
                getActivity().getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
                call.resolve();
            } catch (Exception e) {
                call.reject("Failed to enable FLAG_SECURE: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void disable(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try {
                getActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE);
                call.resolve();
            } catch (Exception e) {
                call.reject("Failed to disable FLAG_SECURE: " + e.getMessage());
            }
        });
    }
}
