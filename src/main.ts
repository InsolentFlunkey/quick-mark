const platform = navigator.userAgentData?.platform ?? navigator.platform;

document.documentElement.dataset.platform = platform.toLowerCase();
