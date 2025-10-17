/**
 * Test script for MCP Filesystem Tools
 *
 * Tests all 7 MCP tools to ensure they're working correctly.
 */

import { executeMCPTool } from './lib/mcp-tools.js'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const TEST_ARTIFACT_ID = 'test-mcp-tools-' + Date.now()
const WORKSPACE_PATH = path.join(__dirname, 'artifact_workspaces', TEST_ARTIFACT_ID)

let testsPassed = 0
let testsFailed = 0

async function test(name, fn) {
  try {
    console.log(`\n🧪 Testing: ${name}`)
    await fn()
    console.log(`✅ PASS: ${name}`)
    testsPassed++
  } catch (error) {
    console.error(`❌ FAIL: ${name}`)
    console.error(`   Error: ${error.message}`)
    testsFailed++
  }
}

async function cleanup() {
  try {
    await fs.rm(WORKSPACE_PATH, { recursive: true, force: true })
    console.log(`\n🧹 Cleaned up test workspace: ${WORKSPACE_PATH}`)
  } catch (error) {
    console.log(`⚠️  Could not clean up: ${error.message}`)
  }
}

async function runTests() {
  console.log('='.repeat(60))
  console.log('🚀 MCP Filesystem Tools Test Suite')
  console.log('='.repeat(60))
  console.log(`Test Artifact ID: ${TEST_ARTIFACT_ID}`)
  console.log(`Workspace Path: ${WORKSPACE_PATH}`)

  // Test 1: write_file
  await test('write_file - Create new file', async () => {
    const result = await executeMCPTool(TEST_ARTIFACT_ID, 'write_file', {
      path: '/test.txt',
      content: 'Hello, MCP!'
    })
    if (!result.includes('Successfully wrote')) {
      throw new Error(`Unexpected result: ${result}`)
    }
  })

  // Test 2: read_file
  await test('read_file - Read existing file', async () => {
    const result = await executeMCPTool(TEST_ARTIFACT_ID, 'read_file', {
      path: '/test.txt'
    })
    if (result !== 'Hello, MCP!') {
      throw new Error(`Expected "Hello, MCP!" but got: ${result}`)
    }
  })

  // Test 3: edit_file
  await test('edit_file - Replace text in file', async () => {
    const result = await executeMCPTool(TEST_ARTIFACT_ID, 'edit_file', {
      path: '/test.txt',
      old_text: 'Hello',
      new_text: 'Goodbye'
    })
    if (!result.includes('Successfully replaced')) {
      throw new Error(`Unexpected result: ${result}`)
    }

    // Verify the edit worked
    const content = await executeMCPTool(TEST_ARTIFACT_ID, 'read_file', {
      path: '/test.txt'
    })
    if (content !== 'Goodbye, MCP!') {
      throw new Error(`Expected "Goodbye, MCP!" but got: ${content}`)
    }
  })

  // Test 4: create_directory
  await test('create_directory - Create new directory', async () => {
    const result = await executeMCPTool(TEST_ARTIFACT_ID, 'create_directory', {
      path: '/components'
    })
    if (!result.includes('Successfully created')) {
      throw new Error(`Unexpected result: ${result}`)
    }
  })

  // Test 5: write_file in subdirectory
  await test('write_file - Create file in subdirectory', async () => {
    const result = await executeMCPTool(TEST_ARTIFACT_ID, 'write_file', {
      path: '/components/Button.jsx',
      content: 'export default function Button() { return <button>Click</button>; }'
    })
    if (!result.includes('Successfully wrote')) {
      throw new Error(`Unexpected result: ${result}`)
    }
  })

  // Test 6: list_files
  await test('list_files - List root directory', async () => {
    const result = await executeMCPTool(TEST_ARTIFACT_ID, 'list_files', {
      directory: '/'
    })
    if (!result.includes('test.txt') || !result.includes('components')) {
      throw new Error(`Expected to see test.txt and components, but got: ${result}`)
    }
  })

  // Test 7: list_files in subdirectory
  await test('list_files - List subdirectory', async () => {
    const result = await executeMCPTool(TEST_ARTIFACT_ID, 'list_files', {
      directory: '/components'
    })
    if (!result.includes('Button.jsx')) {
      throw new Error(`Expected to see Button.jsx, but got: ${result}`)
    }
  })

  // Test 8: delete_file
  await test('delete_file - Delete file', async () => {
    const result = await executeMCPTool(TEST_ARTIFACT_ID, 'delete_file', {
      path: '/test.txt'
    })
    if (!result.includes('Successfully deleted')) {
      throw new Error(`Unexpected result: ${result}`)
    }

    // Verify file is gone
    const readResult = await executeMCPTool(TEST_ARTIFACT_ID, 'read_file', {
      path: '/test.txt'
    })
    if (!readResult.includes('does not exist')) {
      throw new Error(`Expected file not to exist, but got: ${readResult}`)
    }
  })

  // Test 9: Security - Path traversal prevention
  await test('Security - Prevent path traversal', async () => {
    const result = await executeMCPTool(TEST_ARTIFACT_ID, 'read_file', {
      path: '../../package.json'
    })
    if (!result.includes('Error')) {
      throw new Error(`Expected error for path traversal, but got: ${result}`)
    }
  })

  // Test 10: Error handling - Read non-existent file
  await test('Error handling - Read non-existent file', async () => {
    const result = await executeMCPTool(TEST_ARTIFACT_ID, 'read_file', {
      path: '/nonexistent.txt'
    })
    if (!result.includes('does not exist')) {
      throw new Error(`Expected "does not exist" error, but got: ${result}`)
    }
  })

  // Test 11: Error handling - Edit non-existent text
  await test('Error handling - Edit non-existent text', async () => {
    const result = await executeMCPTool(TEST_ARTIFACT_ID, 'edit_file', {
      path: '/components/Button.jsx',
      old_text: 'NonExistentText',
      new_text: 'NewText'
    })
    if (!result.includes('Could not find text')) {
      throw new Error(`Expected "Could not find text" error, but got: ${result}`)
    }
  })

  // Test 12: Performance - Multiple rapid writes
  await test('Performance - Multiple rapid writes', async () => {
    const startTime = Date.now()
    const promises = []

    for (let i = 0; i < 10; i++) {
      promises.push(
        executeMCPTool(TEST_ARTIFACT_ID, 'write_file', {
          path: `/perf-test-${i}.txt`,
          content: `Performance test file ${i}`
        })
      )
    }

    await Promise.all(promises)
    const elapsed = Date.now() - startTime

    console.log(`   ⏱️  Completed 10 writes in ${elapsed}ms (avg ${elapsed/10}ms per write)`)

    if (elapsed > 5000) {
      throw new Error(`Too slow: ${elapsed}ms for 10 writes`)
    }
  })

  // Cleanup
  await cleanup()

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 Test Summary')
  console.log('='.repeat(60))
  console.log(`✅ Passed: ${testsPassed}`)
  console.log(`❌ Failed: ${testsFailed}`)
  console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`)

  if (testsFailed === 0) {
    console.log('\n🎉 All tests passed!')
    process.exit(0)
  } else {
    console.log('\n⚠️  Some tests failed')
    process.exit(1)
  }
}

// Run tests
runTests().catch(error => {
  console.error('\n💥 Test suite crashed:', error)
  cleanup().finally(() => process.exit(1))
})
