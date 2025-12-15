#!/usr/bin/env node
/**
 * 错误消息清理测试脚本
 * 用于验证 errorSanitizer.js 和 claudeConsoleRelayService.js 的安全修复
 */

const { sanitizeErrorMessage } = require('../src/utils/errorSanitizer')

// 颜色输出辅助函数
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function assert(condition, testName) {
  if (condition) {
    log('green', `✅ PASS: ${testName}`)
    return true
  } else {
    log('red', `❌ FAIL: ${testName}`)
    return false
  }
}

// 测试用例
const testCases = [
  {
    name: 'cubence.com 域名清理（完整 URL）',
    input: 'Request failed: https://cubence.com/api/v1/messages',
    shouldNotContain: ['cubence', 'cubence.com'],
    shouldContain: ['Request failed']
  },
  {
    name: 'cubence.com 域名清理（纯域名）',
    input: 'Connection error from cubence.com server',
    shouldNotContain: ['cubence.com', 'cubence'],
    shouldContain: ['Connection error']
  },
  {
    name: 'cubence 关键词清理',
    input: 'Service unavailable, contact cubence support',
    shouldNotContain: ['cubence'],
    shouldContain: ['Service unavailable']
  },
  {
    name: '代理地址清理（SOCKS5）',
    input: 'connect ECONNREFUSED 192.168.1.100:1080 (proxy socks5://user:pass@192.168.1.100:1080)',
    shouldNotContain: ['192.168.1.100', 'socks5://', 'user:pass'],
    shouldContain: ['connect ECONNREFUSED']
  },
  {
    name: '524 错误上游 URL 清理',
    input: 'Request failed with status code 524: https://api.anthropic.com/v1/messages',
    shouldNotContain: ['https://api.anthropic.com', 'anthropic.com'],
    shouldContain: ['Request failed', 'status code 524']
  },
  {
    name: '88code 供应商清理',
    input: 'Error from 88code service, visit https://88code.com for help',
    shouldNotContain: ['88code', 'https://88code.com'],
    shouldContain: ['Error']
  },
  {
    name: 'privnode.com 域名清理（完整 URL）',
    input: 'Request timeout: https://privnode.com/v1/messages',
    shouldNotContain: ['privnode', 'privnode.com', 'https://privnode.com'],
    shouldContain: ['Request timeout']
  },
  {
    name: 'privnode.com 域名清理（纯域名）',
    input: 'API unavailable from privnode.com upstream',
    shouldNotContain: ['privnode.com', 'privnode'],
    shouldContain: ['API unavailable', 'upstream']
  },
  {
    name: 'api-key.info 域名清理（完整 URL）',
    input: 'Authentication failed, visit https://api-key.info/docs for help',
    shouldNotContain: ['api-key.info', 'https://api-key.info'],
    shouldContain: ['Authentication failed']
  },
  {
    name: 'api-key.info 域名清理（错误消息中）',
    input: 'Invalid API key format. Check api-key.info for valid format',
    shouldNotContain: ['api-key.info'],
    shouldContain: ['Invalid API key format']
  },
  {
    name: 'openclaudecode.cn 域名清理',
    input: 'Request failed: https://www.openclaudecode.cn/api/v1/messages',
    shouldNotContain: ['openclaudecode.cn', 'openclaudecode'],
    shouldContain: ['Request failed']
  },
  {
    name: '88code.org 域名清理',
    input: 'Connection error to https://www.88code.org/api endpoint',
    shouldNotContain: ['88code.org', '88code'],
    shouldContain: ['Connection error']
  },
  {
    name: 'api.cubence.com 子域名清理',
    input: 'Upstream timeout: https://api.cubence.com/v1/chat',
    shouldNotContain: ['api.cubence.com', 'cubence.com', 'cubence'],
    shouldContain: ['Upstream timeout']
  },
  {
    name: 'api-dmit.cubence.com 子域名清理',
    input: 'Error from https://api-dmit.cubence.com service',
    shouldNotContain: ['api-dmit.cubence.com', 'cubence.com', 'cubence'],
    shouldContain: ['Error from service']
  },
  {
    name: 'api-bwg.cubence.com 子域名清理',
    input: 'Failed to connect to https://api-bwg.cubence.com/v1',
    shouldNotContain: ['api-bwg.cubence.com', 'cubence.com', 'cubence'],
    shouldContain: ['Failed to connect']
  },
  {
    name: 'api-cf.cubence.com 子域名清理',
    input: 'Service unavailable at https://api-cf.cubence.com',
    shouldNotContain: ['api-cf.cubence.com', 'cubence.com', 'cubence'],
    shouldContain: ['Service unavailable']
  },
  {
    name: 'packyapi.com 域名清理',
    input: 'Authentication failed, visit https://www.packyapi.com for help',
    shouldNotContain: ['packyapi.com', 'packyapi', 'packy'],
    shouldContain: ['Authentication failed']
  },
  {
    name: 'tuza.airaphe.com 域名清理',
    input: 'Request timeout: https://tuza.airaphe.com/api/v1/messages',
    shouldNotContain: ['tuza.airaphe.com', 'airaphe.com', 'airaphe', 'tuza'],
    shouldContain: ['Request timeout']
  },
  {
    name: 'api.i7dc.com 域名清理',
    input: 'Connection error to https://api.i7dc.com/api endpoint',
    shouldNotContain: ['api.i7dc.com', 'i7dc.com', 'i7dc'],
    shouldContain: ['Connection error']
  },
  {
    name: 'openclaudecode.cn 纯域名清理（无 http://）',
    input: 'Service error from openclaudecode.cn provider',
    shouldNotContain: ['openclaudecode.cn', 'openclaudecode'],
    shouldContain: ['Service error', 'provider']
  },
  {
    name: 'airaphe.com 纯域名清理（无 http://）',
    input: 'Visit airaphe.com for API documentation',
    shouldNotContain: ['airaphe.com', 'airaphe'],
    shouldContain: ['API documentation']
  },
  {
    name: 'i7dc.com 纯域名清理（无 http://）',
    input: 'Contact i7dc.com support for assistance',
    shouldNotContain: ['i7dc.com', 'i7dc'],
    shouldContain: ['support', 'assistance']
  },
  {
    name: 'JSON 解析错误（无敏感信息）',
    input: 'Unexpected token < in JSON at position 0',
    shouldNotContain: [],
    shouldContain: ['Unexpected token']
  },
  {
    name: '网络超时错误（保留通用信息）',
    input: 'ETIMEDOUT connecting to upstream server',
    shouldNotContain: [],
    shouldContain: ['ETIMEDOUT']
  },
  {
    name: '内部路径清理',
    input: 'Error: ENOENT: no such file or directory, open /var/app/config/secret.json',
    shouldNotContain: ['/var/app/config/secret.json'],
    shouldContain: ['Error', 'ENOENT']
  },
  {
    name: '空消息处理',
    input: '',
    shouldNotContain: [],
    expectedGeneric: true
  },
  {
    name: '过度清理后返回通用消息',
    input: 'https://example.com',
    shouldNotContain: ['example.com', 'https://'],
    expectedGeneric: true
  }
]

// 运行测试
log('blue', '\n=== 错误消息清理测试 ===\n')

let passed = 0
let failed = 0

testCases.forEach((testCase, index) => {
  log('cyan', `\n测试 ${index + 1}: ${testCase.name}`)
  console.log(`输入: "${testCase.input}"`)

  const result = sanitizeErrorMessage(testCase.input)
  console.log(`输出: "${result}"`)

  let testPassed = true

  // 检查是否应该返回通用消息
  if (testCase.expectedGeneric) {
    testPassed =
      assert(result === 'The requested model is currently unavailable', '应返回通用错误消息') &&
      testPassed
  }

  // 检查不应包含的内容
  if (testCase.shouldNotContain) {
    testCase.shouldNotContain.forEach((term) => {
      const contains = result.toLowerCase().includes(term.toLowerCase())
      testPassed =
        assert(
          !contains,
          `不应包含敏感信息: "${term}"${contains ? ` (但实际包含在: "${result}")` : ''}`
        ) && testPassed
    })
  }

  // 检查应该包含的内容
  if (testCase.shouldContain) {
    testCase.shouldContain.forEach((term) => {
      const contains = result.toLowerCase().includes(term.toLowerCase())
      testPassed =
        assert(
          contains,
          `应保留有用信息: "${term}"${!contains ? ` (但实际输出: "${result}")` : ''}`
        ) && testPassed
    })
  }

  if (testPassed) {
    passed++
  } else {
    failed++
  }
})

// 测试总结
log('blue', '\n=== 测试总结 ===\n')
log('green', `✅ 通过: ${passed}`)
if (failed > 0) {
  log('red', `❌ 失败: ${failed}`)
}

const totalTests = testCases.length
const passRate = ((passed / totalTests) * 100).toFixed(2)
log('cyan', `通过率: ${passRate}%`)

// 额外的安全检查
log('blue', '\n=== 安全检查 ===\n')

const sensitivePatterns = [
  { pattern: /https?:\/\/[^\s]+/, name: 'HTTP(S) URLs' },
  { pattern: /socks5?:\/\/[^\s]+/, name: 'SOCKS 代理 URLs' },
  { pattern: /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+/, name: 'IP:端口' },
  { pattern: /(?:user|username|password|pass)[:=][^\s]+/i, name: '认证凭据' },
  { pattern: /88code|duck|packy|ikun|privnode|yescode|cubence/i, name: '供应商关键词' }
]

const dangerousInputs = [
  'Error: https://api.internal.company.com/secret-endpoint',
  'Proxy auth failed: socks5://admin:p@ssw0rd@10.0.0.1:1080',
  'Database connection failed: mongodb://dbuser:dbpass@192.168.1.50:27017/mydb',
  'Visit https://cubence.com/api-docs for more info',
  'Service error from 88code platform'
]

log('yellow', '测试敏感信息是否被完全清理...\n')

let securityCheckPassed = true

dangerousInputs.forEach((input) => {
  const sanitized = sanitizeErrorMessage(input)
  console.log(`输入: "${input}"`)
  console.log(`输出: "${sanitized}"`)

  sensitivePatterns.forEach((pattern) => {
    const match = sanitized.match(pattern.pattern)
    if (match) {
      log('red', `❌ 安全风险: 检测到 ${pattern.name} - "${match[0]}"`)
      securityCheckPassed = false
    }
  })

  console.log()
})

if (securityCheckPassed) {
  log('green', '✅ 所有安全检查通过！敏感信息已被完全清理。')
} else {
  log('red', '❌ 安全检查失败！仍有敏感信息泄露风险。')
}

// 退出码
log('blue', '\n=== 测试完成 ===\n')

if (failed === 0 && securityCheckPassed) {
  log('green', '🎉 所有测试通过！修复验证成功。')
  process.exit(0)
} else {
  log('red', '⚠️ 部分测试失败，请检查修复代码。')
  process.exit(1)
}
