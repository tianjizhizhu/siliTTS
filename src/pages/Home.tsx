import React, { useState, useRef, useEffect } from 'react';
import { Mic, Play, Pause, Download, Settings, Save, Trash2, Volume2, Zap } from 'lucide-react';

export default function Home() {
  const [apiKey, setApiKey] = useState('');
  const [text, setText] = useState('');
  const [speed, setSpeed] = useState(1.0);
  const [gain, setGain] = useState(0.0);
  const [responseFormat, setResponseFormat] = useState('mp3');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load saved API key
  useEffect(() => {
    const savedKey = localStorage.getItem('siliconflow_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  const handleSaveApiKey = () => {
    localStorage.setItem('siliconflow_api_key', apiKey);
    setShowSettings(false);
  };

  const generateAudio = async () => {
    if (!apiKey.trim()) {
      setError('请先配置API密钥');
      setShowSettings(true);
      return;
    }

    if (!text.trim()) {
      setError('请输入要转换的文本');
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const response = await fetch('https://api.siliconflow.cn/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'fnlp/MOSS-TTSD-v0.5',
          input: text,
          speed: speed,
          gain: gain,
          response_format: responseFormat,
          max_tokens: 1600,
          references: [
            {
              audio: 'https://sf-maas-uat-prod.oss-cn-shanghai.aliyuncs.com/voice_template/fish_audio-Charles.mp3',
              text: '他又躺在那里，眼睛闭着，仍然沉浸在梦境的气氛里。那是个庞杂而亮堂的梦',
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`API错误: ${response.status} - ${errorData}`);
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
    } catch (err: any) {
      setError(err.message || '生成音频时出错');
    } finally {
      setIsGenerating(false);
    }
  };

  const clearAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  };

  const downloadAudio = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `tts_audio.${responseFormat}`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <header className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Mic className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
              SiliconFlow TTS
            </h1>
          </div>
          <p className="text-slate-400 text-lg">
            基于 fnlp/MOSS-TTSD-v0.5 的文本转语音
          </p>
        </header>

        {/* Main Card */}
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-slate-700/50">
          {/* Settings Panel */}
          <div className="flex justify-end mb-6">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm text-slate-200 transition-all hover:shadow-lg"
            >
              <Settings className="w-4 h-4" />
              <span>设置</span>
            </button>
          </div>

          {showSettings && (
            <div className="mb-8 p-6 bg-slate-700/50 rounded-2xl border border-slate-600/50">
              <h3 className="text-lg font-semibold mb-4 text-slate-200 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                API 配置
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    SiliconFlow API Key
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                    <button
                      onClick={handleSaveApiKey}
                      className="px-4 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-blue-500/20"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Text Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              输入文本
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="请输入要转换为语音的文本...（支持 [S1] 和 [S2] 切换说话人"
              className="w-full h-48 px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-slate-100"
            />
            <div className="text-right text-xs text-slate-500 mt-2">
              {text.length} 字符
            </div>
          </div>

          {/* Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                语速 (Speed)
              </label>
              <input
                type="range"
                min="0.25"
                max="4.0"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-center text-sm text-slate-400 mt-1">
                {speed.toFixed(1)}x
              </div>
            </div>

            <div className="p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                音量 (Gain)
              </label>
              <input
                type="range"
                min="-10"
                max="10"
                step="1"
                value={gain}
                onChange={(e) => setGain(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-center text-sm text-slate-400 mt-1">
                {gain.toFixed(0)} dB
              </div>
            </div>

            <div className="p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                格式
              </label>
              <select
                value={responseFormat}
                onChange={(e) => setResponseFormat(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="mp3">MP3</option>
                <option value="wav">WAV</option>
                <option value="opus">OPUS</option>
                <option value="pcm">PCM</option>
              </select>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={generateAudio}
            disabled={isGenerating}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 rounded-2xl font-bold text-lg shadow-xl transition-all hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              生成中...</>
            ) : (
              <>
                <Play className="w-5 h-5" />
                生成语音
              </>
            )}
          </button>

          {/* Audio Player */}
          {audioUrl && (
            <div className="mt-8 p-6 bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-2xl border border-slate-600/50">
              <div className="flex flex-col gap-4">
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  controls
                  className="w-full"
                />
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={downloadAudio}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    下载
                  </button>
                  <button
                    onClick={clearAudio}
                    className="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-300 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    清除
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-slate-500 text-sm">
          <p>
            使用 <span className="text-blue-400 font-medium">fnlp/MOSS-TTSD-v0.5</span> 模型进行高质量语音合成
          </p>
        </footer>
      </div>
    </div>
  );
}
