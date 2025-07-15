import { TestBed } from '@angular/core/testing';

import { GithubApiService } from './github-api.service';

describe('GithubApiService', () => {
  let service: GithubApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GithubApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
  it('should store accessToken when getAccessToken is called with valid response', async () => {
  const fakeToken = 'abc123';
  spyOn(window, 'fetch').and.resolveTo({
    json: async () => ({ access_token: fakeToken })
  } as Response);
  spyOn(localStorage, 'setItem');

  await service.getAccessToken('dummy_code');

  expect(fetch).toHaveBeenCalledWith('http://localhost:4000/getAccessToken?code=dummy_code', { method: 'GET' });
  expect(localStorage.setItem).toHaveBeenCalledWith('accessToken', fakeToken);
});
it('should fetch user data and store username in localStorage', async () => {
  spyOn(localStorage, 'getItem').and.callFake((key) => {
    if (key === 'accessToken') return 'mock_token';
    return null;
  });
  spyOn(window, 'fetch').and.resolveTo({
    json: async () => ({ login: 'testuser' })
  } as Response);
  spyOn(localStorage, 'setItem');

  await service.getUserData();

  expect(fetch).toHaveBeenCalledWith('http://localhost:4000/getUserData', {
    method: 'GET',
    headers: {
      Authorization: 'Bearer mock_token'
    }
  });
  expect(localStorage.setItem).toHaveBeenCalledWith('username', 'testuser');
});

it('should fetch repo list from getRepoList()', async () => {
  spyOn(localStorage, 'getItem').and.returnValue('mock_token');

  const mockResponse = [{ name: 'repo1' }, { name: 'repo2' }];
  spyOn(window, 'fetch').and.resolveTo({
    json: async () => mockResponse
  } as Response);

  const result = await service.getRepoList();

  expect(fetch).toHaveBeenCalledWith(
    'http://localhost:4000/getRepoList?username=mock_token',
    {
      method: 'GET',
      headers: {
        Authorization: 'Bearer mock_token'
      }
    }
  );

  expect(result).toEqual(mockResponse);
});
it('should fetch repo list using username from localStorage', async () => {
  // Simulate localStorage
  spyOn(localStorage, 'getItem').and.callFake((key) => {
    if (key === 'username') return 'testuser';
    if (key === 'accessToken') return 'token123';
    return null;
  });

  // Mock the response of fetch
  const fakeResponse = [{ name: 'repo1' }, { name: 'repo2' }];
  spyOn(window, 'fetch').and.resolveTo({
    json: async () => fakeResponse
  } as Response);

  const result = await service.getRepoList();

  expect(fetch).toHaveBeenCalledWith('http://localhost:4000/getRepoList?username=testuser', {
    method: 'GET',
    headers: {
      Authorization: 'Bearer token123'
    }
  });

  expect(result).toEqual(fakeResponse);
});
it('should fetch repository details using username and repository name', async () => {
  spyOn(localStorage, 'getItem').and.callFake((key) => {
    if (key === 'username') return 'testuser';
    if (key === 'accessToken') return 'token123';
    return null;
  });

  const fakeRepo = { name: 'repo1', id: 1 };
  spyOn(window, 'fetch').and.resolveTo({
    json: async () => fakeRepo
  } as Response);

  const result = await service.getRepository('repo1');

  expect(fetch).toHaveBeenCalledWith('http://localhost:4000/getRepository?username=testuser&repository=repo1', {
    method: 'GET',
    headers: {
      Authorization: 'Bearer token123'
    }
  });

  expect(result).toEqual(fakeRepo);
});
it('should create a repository by calling the correct endpoint', async () => {
  spyOn(localStorage, 'getItem').and.returnValue('token123');

  const fakeResponse = { success: true };
  spyOn(window, 'fetch').and.resolveTo({
    json: async () => fakeResponse
  } as Response);

  await service.createRepository('newRepo');

  expect(fetch).toHaveBeenCalledWith('http://localhost:4000/createRepository?repository=newRepo', {
    method: 'GET',
    headers: {
      Authorization: 'Bearer token123'
    }
  });
});
it('should fetch reference data from the correct endpoint', async () => {
  spyOn(localStorage, 'getItem').and.callFake((key) => {
    if (key === 'username') return 'testuser';
    if (key === 'accessToken') return 'token123';
    return null;
  });

  const mockReference = { ref: 'refs/heads/main' };
  spyOn(window, 'fetch').and.resolveTo({
    json: async () => mockReference
  } as Response);

  const result = await service.getReference('myRepo');

  expect(fetch).toHaveBeenCalledWith('http://localhost:4000/getReference?username=testuser&repository=myRepo', {
    method: 'GET',
    headers: {
      Authorization: 'Bearer token123',
      'Content-Type': 'application/json'
    }
  });

  expect(result).toEqual(mockReference);
});

it('should send tree data to createTree endpoint', async () => {
  spyOn(localStorage, 'getItem').and.callFake((key) => {
    if (key === 'username') return 'testuser';
    if (key === 'accessToken') return 'token123';
    return null;
  });

  const mockTree = [{ path: 'file.js', mode: '100644', type: 'blob', sha: 'abc123' }];
  const mockResponse = { success: true };

  spyOn(window, 'fetch').and.resolveTo({
    json: async () => mockResponse
  } as Response);

  const result = await service.createTree('myRepo', mockTree);

  expect(fetch).toHaveBeenCalledWith('http://localhost:4000/createTree?username=testuser&repository=myRepo', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer token123',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ content: mockTree })
  });

  expect(result).toEqual(mockResponse);
});
it('should send commit data to createCommit endpoint', async () => {
  spyOn(localStorage, 'getItem').and.callFake((key) => {
    if (key === 'username') return 'testuser';
    if (key === 'accessToken') return 'token123';
    return null;
  });

  const mockData = { message: 'Initial commit' };
  const sha = 'abc123';
  const mockResponse = { success: true };

  spyOn(window, 'fetch').and.resolveTo({
    json: async () => mockResponse
  } as Response);

  const result = await service.createCommit('myRepo', mockData, sha);

  expect(fetch).toHaveBeenCalledWith('http://localhost:4000/createCommit?username=testuser&repository=myRepo', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer token123',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sha, content: mockData })
  });

  expect(result).toEqual(mockResponse);
});
it('should send data to updateReference endpoint', async () => {
  spyOn(localStorage, 'getItem').and.callFake((key) => {
    if (key === 'username') return 'testuser';
    if (key === 'accessToken') return 'token123';
    return null;
  });

  const mockData = { ref: 'refs/heads/main', sha: 'abc123' };
  const mockResponse = { success: true };

  spyOn(window, 'fetch').and.resolveTo({
    json: async () => mockResponse
  } as Response);

  const result = await service.updateReference('myRepo', mockData);

  expect(fetch).toHaveBeenCalledWith('http://localhost:4000/updateReference?username=testuser&repository=myRepo', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer token123',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ content: mockData })
  });

  expect(result).toEqual(mockResponse);
});
it('should call getRepositoryAsTar and return tar URL data', async () => {
  spyOn(localStorage, 'getItem').and.callFake((key) => {
    if (key === 'username') return 'testuser';
    if (key === 'accessToken') return 'token123';
    return null;
  });

  const mockResponse = { url: 'https://example.com/repo.tar.gz' };

  spyOn(window, 'fetch').and.resolveTo({
    json: async () => mockResponse
  } as Response);

  const result = await service.getRepositoryAsTar('myRepo');

  expect(fetch).toHaveBeenCalledWith('http://localhost:4000/getRepositoryAsTar?username=testuser&repository=myRepo', {
    method: 'GET',
    headers: {
      Authorization: 'Bearer token123'
    }
  });

  expect(result).toEqual(mockResponse);
});
it('should call getTar with correct URL and headers', async () => {
  spyOn(localStorage, 'getItem').and.callFake((key) => {
    if (key === 'accessToken') return 'mock_token';
    return null;
  });

  const mockResponse = new Response(new Blob(['tarball content']), { status: 200 });
  spyOn(window, 'fetch').and.resolveTo(mockResponse);

  const result = await service.getTar('http://example.com/file.tar');

  expect(fetch).toHaveBeenCalledWith('http://localhost:4000/getTar?url=http://example.com/file.tar', {
    method: 'GET',
    headers: {
      Authorization: 'Bearer mock_token'
    }
  });
  expect(result).toBe(mockResponse);
});
it('should call getRepoTree and return data', async () => {
  const mockTree = { tree: [{ path: 'file1.js' }, { path: 'file2.js' }] };
  const username = 'testuser';
  const repository = 'testrepo';
  const sha = '123abc';

  spyOn(localStorage, 'getItem').and.callFake((key) => {
    if (key === 'accessToken') return 'mock_token';
    return null;
  });

  spyOn(window, 'fetch').and.resolveTo({
    json: async () => mockTree
  } as Response);

  const result = await service.getRepoTree(username, repository, sha);

  expect(fetch).toHaveBeenCalledWith(
    `https://api.github.com/repos/${username}/${repository}/git/trees/${sha}?recursive=1`,
    {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer mock_token',
        'Content-Type': 'application/json'
      }
    }
  );

  expect(result).toEqual(mockTree);
});

});
