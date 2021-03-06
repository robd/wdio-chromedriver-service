import path from 'path'
import fs from 'fs-extra'
import ChromeDriver from 'chromedriver'
import ChromeDriverLauncher from '../src/launcher'

jest.mock('fs-extra', () => ({
    createWriteStream: jest.fn(),
    ensureFileSync: jest.fn()
}))

const pipe = jest.fn()

let config, options, capabilities, multiremoteCaps

describe('ChromeDriverLauncher launcher', () => {
    beforeAll(() => {
        ChromeDriver.start = jest.fn().mockReturnValue({
            stdout: { pipe },
            stderr: { pipe },
        })
    })

    beforeEach(() => {
        config = {}
        options = {}
        capabilities = [
            { browserName: 'chrome' },
            { browserName: 'firefox' }
        ]
        multiremoteCaps = {
            myCustomChromeBrowser: {
                capabilities: {
                    browserName: 'chrome'
                }
            },
            myCustomFirefoxBrowser: {
                capabilities: {
                    browserName: 'firefox'
                }
            }
        }
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('onPrepare', () => {
        test('should set correct starting options', async () => {
            const Launcher = new ChromeDriverLauncher(options, capabilities, config)
            Launcher._redirectLogStream = jest.fn()

            await Launcher.onPrepare()

            expect(ChromeDriver.start.mock.calls[0][0]).toEqual(['--port=9515', '--url-base=/'])
        })

        test('should set (and overwrite config.outputDir) outputDir when passed in the options', async () => {
            options.outputDir = 'options-outputdir'
            config.outputDir = 'config-outputdir'
            const Launcher = new ChromeDriverLauncher(options, capabilities, config)
            Launcher._redirectLogStream = jest.fn()

            await Launcher.onPrepare()

            expect(Launcher.outputDir).toEqual('options-outputdir')
        })

        test('should set path when passed in the options', async () => {
            options.path = 'options-path'
            const Launcher = new ChromeDriverLauncher(options, capabilities, config)
            Launcher._redirectLogStream = jest.fn()

            await Launcher.onPrepare()

            expect(Launcher.capabilities).toEqual([
                {
                    browserName: 'chrome',
                    protocol: 'http',
                    hostname: 'localhost',
                    port: 9515,
                    path: 'options-path'
                },
                {
                    browserName: 'firefox'
                }
            ])
        })

        test('should set port when passed in the options', async () => {
            options.port = 7676
            const Launcher = new ChromeDriverLauncher(options, capabilities, config)
            Launcher._redirectLogStream = jest.fn()

            await Launcher.onPrepare()

            expect(Launcher.capabilities).toEqual([
                {
                    browserName: 'chrome',
                    protocol: 'http',
                    hostname: 'localhost',
                    port: 7676,
                    path: '/'
                },
                {
                    browserName: 'firefox'
                }
            ])
        })

        test('should set protocol when passed in the options', async () => {
            options.protocol = 'https'
            const Launcher = new ChromeDriverLauncher(options, capabilities, config)
            Launcher._redirectLogStream = jest.fn()

            await Launcher.onPrepare()

            expect(Launcher.capabilities).toEqual([
                {
                    browserName: 'chrome',
                    protocol: 'https',
                    hostname: 'localhost',
                    port: 9515,
                    path: '/'
                },
                {
                    browserName: 'firefox'
                }
            ])
        })

        test('should set hostname when passed in the options', async () => {
            options.hostname = 'dummy'
            const Launcher = new ChromeDriverLauncher(options, capabilities, config)
            Launcher._redirectLogStream = jest.fn()

            await Launcher.onPrepare()

            expect(Launcher.capabilities).toEqual([
                {
                    browserName: 'chrome',
                    protocol: 'http',
                    hostname: 'dummy',
                    port: 9515,
                    path: '/'
                },
                {
                    browserName: 'firefox'
                }
            ])
        })

        test('should set capabilities', async () => {
            const Launcher = new ChromeDriverLauncher(options, capabilities, config)
            Launcher._redirectLogStream = jest.fn()

            await Launcher.onPrepare()

            expect(Launcher.capabilities).toEqual([
                {
                    browserName: 'chrome',
                    protocol: 'http',
                    hostname: 'localhost',
                    port: 9515,
                    path: '/'
                },
                {
                    browserName: 'firefox'
                }
            ])
        })

        test('should set capabilities when using multiremote', async () => {
            const Launcher = new ChromeDriverLauncher(options, multiremoteCaps, config)
            Launcher._redirectLogStream = jest.fn()

            await Launcher.onPrepare()

            expect(Launcher.capabilities).toEqual({
                myCustomChromeBrowser: {
                    protocol: 'http',
                    hostname: 'localhost',
                    port: 9515,
                    path: '/',
                    capabilities: {
                        browserName: 'chrome',
                    }
                },
                myCustomFirefoxBrowser: {
                    capabilities: {
                        browserName: 'firefox'
                    }
                }
            })
        })

        test('should set capabilities when the browserName is not lowercase', async () => {
            capabilities.map(cap => {
                if (cap.browserName === 'chrome') {
                    cap.browserName = 'Chrome'
                }
            })
            const Launcher = new ChromeDriverLauncher(options, capabilities, config)
            Launcher._redirectLogStream = jest.fn()

            await Launcher.onPrepare()

            expect(Launcher.capabilities).toEqual([
                {
                    browserName: 'Chrome',
                    protocol: 'http',
                    hostname: 'localhost',
                    port: 9515,
                    path: '/'
                },
                {
                    browserName: 'firefox'
                }
            ])
        })

        test('should set correct config properties', async () => {
            config.outputDir = 'dummy'
            const Launcher = new ChromeDriverLauncher(options, capabilities, config)
            Launcher._redirectLogStream = jest.fn()

            await Launcher.onPrepare()

            expect(Launcher.outputDir).toEqual('dummy')
        })

        test('should set correct port and path', async () => {
            const Launcher = new ChromeDriverLauncher(options, capabilities, config)
            Launcher._redirectLogStream = jest.fn()

            await Launcher.onPrepare()

            expect(Launcher.args).toEqual(['--port=9515', '--url-base=/'])
        })

        test('should set correct args', async () => {
            options.args = ['--silent']
            const Launcher = new ChromeDriverLauncher(options, capabilities, config)
            Launcher._redirectLogStream = jest.fn()

            await Launcher.onPrepare()

            expect(Launcher.args).toEqual(['--silent', '--port=9515', '--url-base=/'])
        })

        test('should throw if the argument "--port" is passed', async () => {
            options.args = ['--port=9616']
            const Launcher = new ChromeDriverLauncher(options, capabilities, config)
            Launcher._redirectLogStream = jest.fn()

            await expect(Launcher.onPrepare()).rejects.toThrow(new Error('Argument "--port" already exists'))
        })

        test('should throw if the argument "--url-base" is passed', async () => {
            options.args = ['--url-base=/dummy']
            const Launcher = new ChromeDriverLauncher(options, capabilities, config)
            Launcher._redirectLogStream = jest.fn()

            await expect(Launcher.onPrepare()).rejects.toThrow(new Error('Argument "--url-base" already exists'))
        })

        test('should set correct config properties when empty', async () => {
            const Launcher = new ChromeDriverLauncher(options, capabilities, config)
            Launcher._redirectLogStream = jest.fn()

            await Launcher.onPrepare({})

            expect(Launcher.args).toBeUndefined
        })

        test('should call ChromeDriver start', async () => {
            const Launcher = new ChromeDriverLauncher(options, capabilities, config)
            Launcher._redirectLogStream = jest.fn()

            await Launcher.onPrepare()

            expect(ChromeDriver.start.mock.calls[0][0]).toEqual(['--port=9515', '--url-base=/'])
        })

        test('should not output the log file', async () => {
            const Launcher = new ChromeDriverLauncher(options, capabilities, config)
            Launcher._redirectLogStream = jest.fn()

            await Launcher.onPrepare({})

            expect(Launcher._redirectLogStream).not.toBeCalled()
        })

        test('should output the log file', async () => {
            options.outputDir = 'dummy'
            const Launcher = new ChromeDriverLauncher(options, capabilities, config)
            Launcher._redirectLogStream = jest.fn()

            await Launcher.onPrepare()

            expect(Launcher._redirectLogStream).toBeCalled()
        })
    })

    describe('onComplete', () => {
        test('should call ChromeDriver.stop', async () => {
            const Launcher = new ChromeDriverLauncher(options, capabilities, config)
            Launcher._redirectLogStream = jest.fn()

            await Launcher.onPrepare({})

            Launcher.onComplete()

            expect(ChromeDriver.stop).toBeCalled()
        })

        test('should not call process.kill', () => {
            const Launcher = new ChromeDriverLauncher(options, capabilities, config)
            Launcher.onComplete()

            expect(Launcher.process).toBeFalsy()
        })
    })

    describe('_redirectLogStream', () => {
        test('should write output to file', async () => {
            config.outputDir = 'dummy'
            const Launcher = new ChromeDriverLauncher(options, capabilities, config)

            await Launcher.onPrepare()

            expect(fs.createWriteStream.mock.calls[0][0]).toBe(path.join(process.cwd(), 'dummy', 'wdio-chromedriver.log'))
            expect(Launcher.process.stdout.pipe).toBeCalled()
            expect(Launcher.process.stderr.pipe).toBeCalled()
        })
    })
})
