# 홈 프로젝트 시연

Manta Code Blocks의 공개 데모를 홈에서 재사용한다. 첫 프레임은 같은 영상에서 추출한 포스터다. 영상 자체의 녹화 버전과 시간을 바꾸지 않는다.

- [공개 원본](https://github.com/woonyong-choi/manta-code-blocks/blob/cddab44041bb4e7e78c5783c04d1cb8707bf55a4/docs/assets/manta-code-blocks-intro.mp4)
- [프로젝트와 사용 안내](https://github.com/woonyong-choi/manta-code-blocks)
- [MIT 라이선스](https://github.com/woonyong-choi/manta-code-blocks/blob/cddab44041bb4e7e78c5783c04d1cb8707bf55a4/LICENSE)

`manta-code-blocks-intro.mp4`는 내려받은 원본(H.264, `gbrp` RGB, 전체 범위)이라 크롬 등에서 색이 분홍으로 어긋난다. 보존만 하고 홈은 웹 호환 변환본 `manta-code-blocks-intro-web.mp4`를 쓴다. 변환 명령:

```sh
ffmpeg -i manta-code-blocks-intro.mp4 -map 0:v:0 -an \
  -vf "scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int,format=yuv420p" \
  -c:v libx264 -preset slow -crf 18 -profile:v high \
  -x264-params colorprim=bt709:transfer=bt709:colormatrix=bt709:range=tv \
  -movflags +faststart manta-code-blocks-intro-web.mp4
```

두 MP4는 1600×900, 6초이고 소리가 없다. 새 웹 영상은 `yuv420p`, BT.709, `+faststart`로 만든다. 포스터는 첫 프레임의 PNG다. 발행 과정은 사용하는 미디어와 원본 MIT 고지인 `manta-code-blocks-LICENSE.txt`를 함께 포함한다. 이 문서는 내보내지 않는다.
