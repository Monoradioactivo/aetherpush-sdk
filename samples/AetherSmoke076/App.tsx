import React, { useState } from 'react';
import { Button, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import CodePush from '@aetherpush/react-native-code-push';

function statusName(status: number): string {
  const entry = Object.entries(CodePush.SyncStatus).find(([, v]) => v === status);
  return entry ? entry[0] : String(status);
}

function App(): React.JSX.Element {
  const [log, setLog] = useState<string[]>([]);

  const append = (line: string) => setLog(prev => [...prev, line]);

  const runSync = (serverPathMode?: 'aether' | 'codepush-legacy') => {
    append(`sync start (${serverPathMode ?? 'default'})`);
    CodePush.sync(
      { serverPathMode, installMode: CodePush.InstallMode.ON_NEXT_RESTART },
      status => append(`status: ${statusName(status)}`),
      progress => append(`progress: ${progress.receivedBytes}/${progress.totalBytes}`),
    )
      .then(result => append(`sync done: ${statusName(result)}`))
      .catch(err => append(`sync error: ${err.message}`));
  };

  const checkForUpdate = () => {
    CodePush.checkForUpdate()
      .then(update => append(update ? `update available: ${update.label}` : 'up to date'))
      .catch(err => append(`check error: ${err.message}`));
  };

  const getMetadata = () => {
    CodePush.getUpdateMetadata(CodePush.UpdateState.RUNNING)
      .then(pkg => append(pkg ? `running: ${pkg.label} (${pkg.packageHash?.slice(0, 8)})` : 'running: binary'))
      .catch(err => append(`metadata error: ${err.message}`));
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Aether SDK smoke</Text>
      <View style={styles.buttons}>
        <Button title="Sync" onPress={() => runSync()} />
        <Button title="Sync (legacy paths)" onPress={() => runSync('codepush-legacy')} />
        <Button title="Check for update" onPress={checkForUpdate} />
        <Button title="Running package" onPress={getMetadata} />
        <Button title="Restart" onPress={() => CodePush.restartApp()} />
        <Button title="Clear log" onPress={() => setLog([])} />
      </View>
      <ScrollView style={styles.log}>
        {log.map((line, i) => (
          <Text key={i} style={styles.logLine} testID={`log-${i}`}>
            {line}
          </Text>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginVertical: 12 },
  buttons: { gap: 4, paddingHorizontal: 16 },
  log: { flex: 1, marginTop: 12, paddingHorizontal: 16 },
  logLine: { fontFamily: 'Courier', fontSize: 12 },
});

export default CodePush({ checkFrequency: CodePush.CheckFrequency.MANUAL })(App);
