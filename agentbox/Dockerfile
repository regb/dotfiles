FROM ubuntu:24.04

ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        bash \
        build-essential \
        ca-certificates \
        curl \
        fd-find \
        fzf \
        git \
        gh \
        gnupg \
        iproute2 \
        libicu74 \
        openjdk-21-jre-headless \
        python3 \
        python3-pip \
        python-is-python3 \
        ripgrep \
        tmux \
        unzip \
        vim \
        zip \
        libglib2.0-0 libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
        libcups2 libdrm2 libdbus-1-3 libxkbcommon0 libxcomposite1 \
        libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2t64 \
        libpango-1.0-0 libcairo2 libatspi2.0-0 libgtk-3-0 \
        libx11-6 libx11-xcb1 libxcb1 libxext6 libxshmfence1 libxss1 \
        fonts-liberation xclip xsel wl-clipboard \
    && rm -rf /var/lib/apt/lists/* \
    && ln -s /usr/bin/fdfind /usr/local/bin/fd

RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get update \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g @earendil-works/pi-coding-agent agent-browser \
    && agent-browser install

RUN corepack enable \
    && corepack prepare pnpm@latest --activate \
    && pnpm --version

RUN mkdir -p /etc/bazel && printf '%s\n' \
    'build --disk_cache=/var/tmp/bazel-disk-cache' \
    'test --disk_cache=/var/tmp/bazel-disk-cache' \
    'run --disk_cache=/var/tmp/bazel-disk-cache' \
    'query --disk_cache=/var/tmp/bazel-disk-cache' \
    'aquery --disk_cache=/var/tmp/bazel-disk-cache' \
    'cquery --disk_cache=/var/tmp/bazel-disk-cache' \
    'coverage --disk_cache=/var/tmp/bazel-disk-cache' \
    > /etc/bazel.bazelrc

RUN curl -fsSL -o /usr/local/bin/bazel \
      https://github.com/bazelbuild/bazelisk/releases/latest/download/bazelisk-linux-amd64 \
    && chmod 0755 /usr/local/bin/bazel

RUN useradd -m -s /bin/bash dev \
    && mkdir -p \
        /home/dev/.cache \
        /home/dev/.claude \
        /home/dev/.config \
        /home/dev/.pi/agent \
        /home/dev/.ssh \
    && chown -R dev:dev /home/dev /usr/lib/node_modules /usr/bin

RUN printf '%s\n' \
    'alias ls="ls --color=auto"' \
    'alias grep="grep --color=auto"' \
    'export PS1="\[\e[32m\]\u@\h\[\e[0m\]:\[\e[34m\]\w\[\e[0m\]\$ "' \
    >> /etc/bash.bashrc

ENV USER=dev \
    PATH=/usr/local/bin:/usr/bin:/bin \
    EDITOR=vim \
    VISUAL=vim \
    DEVCONTAINER=true

WORKDIR /workspace

ENTRYPOINT ["/bin/bash", "-lc"]
CMD ["bash"]
