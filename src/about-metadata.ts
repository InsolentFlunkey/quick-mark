export interface AppMetadata {
  name: string;
  version: string;
  publisher: string;
  homepage: string;
  description: string;
}

export interface AboutElements {
  title: HTMLElement;
  description: HTMLElement;
  version: HTMLElement;
  publisher: HTMLElement;
  repository: HTMLButtonElement;
}

export interface AboutDependencies {
  metadata: AppMetadata;
  openRepository(url: string): Promise<void>;
  reportError(message: string): void;
}

export function populateAbout(elements: AboutElements, metadata: AppMetadata): void {
  elements.title.textContent = `About ${metadata.name}`;
  elements.description.textContent = metadata.description;
  elements.version.textContent = metadata.version;
  elements.publisher.textContent = metadata.publisher;
  elements.repository.textContent = metadata.homepage;
  elements.repository.title = `Open ${metadata.homepage} in the default browser`;
}

export function connectAbout(elements: AboutElements, dependencies: AboutDependencies): void {
  populateAbout(elements, dependencies.metadata);
  elements.repository.addEventListener("click", () => {
    void dependencies.openRepository(dependencies.metadata.homepage).catch((error) => {
      dependencies.reportError(`Could not open the QuickMark repository: ${String(error)}`);
    });
  });
}
