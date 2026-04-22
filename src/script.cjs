const { execSync } = require('child_process');
const fs = require('fs');

try {
  const result = execSync('git log -p -n 5 src/components/DataPipeline.tsx').toString();
  fs.writeFileSync('gitlog.txt', result);
  console.log("Success");
} catch (e) {
  console.log(e);
}
