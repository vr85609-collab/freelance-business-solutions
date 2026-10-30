# Annotation-only metadata in the instrumentation dependencies; none is a runtime API.
-dontwarn com.google.errorprone.annotations.CanIgnoreReturnValue
-dontwarn com.google.errorprone.annotations.MustBeClosed
-dontwarn kotlin.jvm.internal.SourceDebugExtension
# JUnit discovers this class and its methods reflectively in the separate test APK.
-keep class com.aquaemoticons.arcade.OfflineArcadeTest { *; }
-keepattributes *Annotation*
