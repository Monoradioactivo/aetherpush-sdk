module.exports = {
    dependency: {
        platforms: {
            android: {
                sourceDir: './android',
                // The package class is CodePush (not the default <Name>Package), so
                // point autolinking at it and instantiate with the application
                // context. CodePush reads its deployment key from strings.xml, so no
                // key is needed here. libraryName still derives from codegenConfig,
                // so the New-Architecture TurboModule provider is registered.
                packageImportPath: 'import com.microsoft.codepush.react.CodePush;',
                packageInstance: 'new CodePush(getApplicationContext())',
            }
        }
    }
};
