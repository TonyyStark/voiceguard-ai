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
## 🐳 Option 2: Docker (Recommended for Production)

```bash
# Clone repository
git clone https://github.com/yourusername/voiceguard-ai.git
cd voiceguard-ai

# Create environment file
cp .env.example .env

# Start all services
docker-compose up -d

# Access application
# Frontend: http://localhost:3000
# API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### 🛠️ Manual Setup
**1️⃣ Backend Setup**
```bash
cd backend
python -m venv venv

# Activate virtual environment
# Linux/macOS:
source venv/bin/activate
# Windows:
venv\Scripts\activate

pip install -r requirements.txt
python -m app.main
```
**2️⃣ Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```
## 📖 Usage
**Web Interface**

- Open http://localhost:3000
- Enter a User ID
- Click "Enroll" to register your voice (speak for 5 seconds)
- Click "Authenticate" to verify (speak for 3 seconds)

**API Integration**
Enroll User:
```bash
curl -X POST "http://localhost:8000/api/v1/enroll" \
  -F "user_id=john_doe" \
  -F "audio_files=@sample1.wav" \
  -F "audio_files=@sample2.wav" \
  -F "audio_files=@sample3.wav"
```
Authenticate:
```bash
curl -X POST "http://localhost:8000/api/v1/authenticate" \
  -F "user_id=john_doe" \
  -F "audio_file=@voice_sample.wav"
```
Response:
```json
{
  "success": true,
  "is_live": true,
  "speaker_score": 0.89,
  "liveness_score": 0.94,
  "confidence": 0.92,
  "is_authenticated": true,
  "processing_time_ms": 420,
  "message": "Authentication successful",
  "timestamp": "2024-01-15T10:30:00"
}
```
## 🏗️ Architecture
```SCSS
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   FastAPI        │────▶│   VoiceGuard    │
│   (Next.js)     │◄────│   Backend        │◄────│   Core Engine   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  PostgreSQL  │      │    Redis     │      │   MongoDB    │
│  (User Data) │      │  (Sessions)  │      │  (Metadata)  │
└──────────────┘      └──────────────┘      └──────────────┘
```
## 🔧 Configuration
Environment variables (.env):

| Variable             | Description                                  | Default |
| -------------------- | -------------------------------------------- | ------- |
| `SPEAKER_THRESHOLD`  | Minimum similarity for speaker match         | 0.75    |
| `LIVENESS_THRESHOLD` | Minimum liveness confidence                  | 0.85    |
| `LIVENESS_METHOD`    | Detection method (doppler/pop\_noise/hybrid) | hybrid  |
| `MAX_AUDIO_DURATION` | Maximum audio length in seconds              | 10      |


## 🤝 Integration Examples
**WordPress Plugin**
```php
// Add to functions.php
function voiceguard_auth_form() {
    echo '<div id="voiceguard-auth"></div>';
    wp_enqueue_script('voiceguard-sdk', 'http://localhost:3000/voiceguard.js');
}
add_action('login_form', 'voiceguard_auth_form');
```
**Python SDK**
```pyhton
from voiceguard_sdk import VoiceGuardAuthSDK

sdk = VoiceGuardAuthSDK("http://localhost:8000", "your-api-key")
result = sdk.authenticate_file("voice.wav", "user_id")
print(result.is_authenticated)
```
**🧪 Testing**
```bash
# Run backend tests
cd backend
pytest tests/ -v

# Run frontend tests
cd frontend
npm test
```
### 🛡️ Security Considerations
- HTTPS Required: Always use HTTPS in production
- Secret Key: Change default SECRET_KEY in production
- Rate Limiting: Implement rate limiting for API endpoints
- Audio Storage: Encrypt stored voice templates
- Liveness Detection: Essential for preventing replay attacks
###📝 Citation
If you use VoiceGuard AI in your research, please cite:
```bibtex
@software{voiceguard2024,
  title={VoiceGuard AI: Voice Biometric Authentication with Liveness Detection},
  author={Your Name},
  year={2024},
  url={https://github.com/yourusername/voiceguard-ai}
}
```
