# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Add any project specific keep options here:

# Java serialization calls these hooks reflectively; without them R8 strips
# NotificationContent.writeObject and scheduling dies with
# NotSerializableException: android.net.Uri$HierarchicalUri.
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    !static !transient <fields>;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    private void readObjectNoData();
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# expo-notifications persists scheduled reminders as ObjectOutputStream blobs
# in SharedPreferences. Class names, fields and the computed serialVersionUID
# (triggers declare none) must match what earlier builds wrote, or reminders
# saved before an update stop deserializing. Keep the package unobfuscated.
-keep,includedescriptorclasses class expo.modules.notifications.** { *; }
