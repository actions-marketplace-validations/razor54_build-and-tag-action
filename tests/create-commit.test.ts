import nock from 'nock'
import createCommit from '../src/lib/create-commit'
import { generateToolkit } from './helpers'
import { Toolkit } from 'actions-toolkit'

describe('create-commit', () => {
  let tools: Toolkit
  let treeParams: any
  let commitParams: any

  beforeEach(() => {
    nock('https://api.github.com')
      .post('/repos/JasonEtco/test/git/commits')
      .reply(200, (_, body) => {
        commitParams = body
      })
      .post('/repos/JasonEtco/test/git/trees')
      .reply(200, (_, body) => {
        treeParams = body
      })

    tools = generateToolkit()
  })

  it('creates the tree and commit', async () => {
    await createCommit(tools)
    expect(nock.isDone()).toBe(true)

    // Test that our tree was created correctly
    expect(treeParams.tree).toHaveLength(2)
    expect(treeParams.tree.some((obj: any) => obj.path === 'index.js')).toBe(
      true
    )

    // Test that our commit was created correctly
    expect(commitParams.message).toBe('Automatic compilation')
    expect(commitParams.parents).toEqual([tools.context.sha])
  })

  it('creates the tree and commit with additional files', async () => {
    process.env.INPUT_ADDITIONAL_FILES = "package.json,additional.js"

    await createCommit(tools)
    expect(nock.isDone()).toBe(true)

    // Test that our tree was created correctly
    expect(treeParams.tree).toHaveLength(4)
    expect(treeParams.tree.some((obj: any) => obj.path === 'package.json')).toBe(
      true
    )
    expect(treeParams.tree.some((obj: any) => obj.path === 'additional.js')).toBe(
      true
    )

    // Test that our commit was created correctly
    expect(commitParams.message).toBe('Automatic compilation')
    expect(commitParams.parents).toEqual([tools.context.sha])

    delete process.env.INPUT_ADDITIONAL_FILES
  })

  it('creates the tree and commit with additional files ignoring action.yml', async () => {
    process.env.INPUT_ADDITIONAL_FILES = "additional.js"
    process.env.INPUT_JS_PACKAGE = "true"

    await createCommit(tools)
    expect(nock.isDone()).toBe(true)

    // Test that our tree was created correctly
    expect(treeParams.tree).toHaveLength(3)
    expect(treeParams.tree.some((obj: any) => obj.path === 'package.json')).toBe(
      true
    )
    expect(treeParams.tree.some((obj: any) => obj.path === 'additional.js')).toBe(
      true
    )

    expect(treeParams.tree.some((obj: any) => obj.path === 'action.yml')).toBe(
      false
    )

    // Test that our commit was created correctly
    expect(commitParams.message).toBe('Automatic compilation')
    expect(commitParams.parents).toEqual([tools.context.sha])

    delete process.env.INPUT_ADDITIONAL_FILES
    delete process.env.INPUT_JS_PACKAGE
  })

  it('creates the tree and commit', async () => {
    jest.spyOn(tools, 'getPackageJSON').mockReturnValueOnce({})
    await expect(() => createCommit(tools)).rejects.toThrow(
      'Property "main" does not exist in your `package.json`.'
    )
  })
})
