require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'CodePush'
  s.version        = package['version'].gsub(/v|-beta/, '')
  s.summary        = package['description']
  s.author         = package['author']
  s.license        = package['license']
  s.homepage       = package['homepage']
  s.source         = { :git => 'https://github.com/Monoradioactivo/aetherpush-sdk.git', :tag => "v#{s.version}"}
  s.ios.deployment_target = '15.5'
  s.tvos.deployment_target = '15.5'
  s.preserve_paths = '*.js'
  s.library        = 'z'
  s.source_files = 'ios/CodePush/*.{h,m,mm}'
  s.public_header_files = ['ios/CodePush/CodePush.h']
  s.pod_target_xcconfig = { "DEFINES_MODULE" => "YES" }

  # Note: Even though there are copy/pasted versions of some of these dependencies in the repo,
  # we explicitly let CocoaPods pull in the versions below so all dependencies are resolved and
  # linked properly at a parent workspace level.
  # install_modules_dependencies pulls in React-Core plus the New Architecture
  # codegen dependencies (ReactCommon, RCT-Folly, generated spec) so the TurboModule
  # compiles; it is a no-op that we fall back from on older React Native.
  if respond_to?(:install_modules_dependencies, true)
    install_modules_dependencies(s)
  else
    s.dependency 'React-Core'
  end
  s.dependency 'SSZipArchive', '~> 2.5.5'
  s.dependency 'JWT', '~> 3.0.0-beta.12'
  s.dependency 'Base64', '~> 1.1'
end
