# 🔐 VoiceGuard AI

**AI-Powered Voice Biometric Authentication with Liveness Detection**

[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-000000.svg?logo=next.js)](https://nextjs.org)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

VoiceGuard AI is a production-ready voice biometric authentication system that combines **speaker verification** with **liveness detection** to prevent replay attacks, voice cloning, and spoofing attempts.

## 🎯 Key Features

- **🔊 Speaker Verification**: ECAPA-TDNN deep learning embeddings for accurate voice identification
- **🛡️ Liveness Detection**: Hybrid approach combining Doppler articulatory gesture analysis and pop noise detection
- **⚡ Real-time Processing**: &lt;500ms authentication latency
- **🎯 High Accuracy**: 99% liveness detection, &lt;1% Equal Error Rate (EER)
- **🔌 Easy Integration**: REST API and SDKs for web, mobile, and desktop applications
- **🐳 Docker Support**: One-command deployment with Docker Compose

## 📊 Performance Metrics

| Component | Accuracy | Reference |
|-----------|----------|-----------|
| Liveness Detection | 99% | VoiceGesture Research |
| Speaker Verification | 96-99% | ECAPA-TDNN |
| Replay Attack Detection | &gt;98% | Doppler Analysis |
| Processing Latency | &lt;500ms | Optimized Pipeline |

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+
- 8GB RAM (16GB recommended)
- Microphone access

### Installation

#### Option 1: Automated Setup

**Linux/macOS:**
```bash
git clone https://github.com/TonyyStark/voiceguard-ai.git
cd voiceguard-ai
chmod +x scripts/setup.sh
./scripts/setup.sh
```

**Windows:**
```bash
git clone https://github.com/TonyyStark/voiceguard-ai.git
cd voiceguard-ai
scripts\setup.bat
```

