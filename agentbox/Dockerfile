FROM ubuntu:24.04

ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        bash \
        build-essential \
        ca-certificates \
        curl \
        direnv \
        fd-find \
        file \
        fzf \
        git \
        gh \
        gnupg \
        iproute2 \
        jq \
        libicu74 \
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

RUN curl -LsSf https://astral.sh/uv/install.sh | sh \
    && install -m 0755 /root/.local/bin/uv /usr/local/bin/uv \
    && install -m 0755 /root/.local/bin/uvx /usr/local/bin/uvx \
    && uv --version

ARG GRPCURL_VERSION=1.9.3
RUN curl -fsSLo /tmp/grpcurl.tar.gz \
      "https://github.com/fullstorydev/grpcurl/releases/download/v${GRPCURL_VERSION}/grpcurl_${GRPCURL_VERSION}_linux_x86_64.tar.gz" \
    && tar --no-same-owner -xzf /tmp/grpcurl.tar.gz -C /usr/local/bin grpcurl \
    && rm -f /tmp/grpcurl.tar.gz \
    && chmod 0755 /usr/local/bin/grpcurl \
    && grpcurl --version

# Homebrew + glab (officially supported installation path for glab)
RUN NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" \
    && eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)" \
    && brew install glab \
    && glab --version

RUN curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public \
      | gpg --dearmor -o /usr/share/keyrings/stripe.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" \
      > /etc/apt/sources.list.d/stripe.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends stripe \
    && rm -rf /var/lib/apt/lists/* \
    && stripe version

RUN mkdir -p /etc/bazel && printf '%s\n' \
    'common --disk_cache=/var/tmp/bazel-disk-cache' \
    'common --repository_cache=/var/tmp/bazel-repository-cache' \
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
    && chown -R dev:dev /home/dev /usr/lib/node_modules /usr/bin /home/linuxbrew/.linuxbrew

RUN printf '%s\n' \
    'alias ls="ls --color=auto"' \
    'alias grep="grep --color=auto"' \
    'export PS1="\[\e[32m\]\u@\h\[\e[0m\]:\[\e[34m\]\w\[\e[0m\]\$ "' \
    'eval "$(direnv hook bash)"' \
    >> /etc/bash.bashrc

ENV USER=dev \
    PATH=/home/linuxbrew/.linuxbrew/bin:/home/linuxbrew/.linuxbrew/sbin:/usr/local/bin:/usr/bin:/bin \
    EDITOR=vim \
    VISUAL=vim \
    DEVCONTAINER=true \
    AGENTBOX=true

WORKDIR /workspace

ENTRYPOINT ["/bin/bash", "-lc"]
CMD ["bash"]
