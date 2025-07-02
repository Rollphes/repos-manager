import { FavoriteService } from '../../src/services/FavoriteService';

describe('FavoriteService', () => {
  let favoriteService: FavoriteService;

  beforeEach(() => {
    favoriteService = new FavoriteService();
  });

  afterEach(() => {
    favoriteService.dispose();
  });

  test('should initialize with empty favorites', () => {
    expect(favoriteService.getFavorites()).toEqual([]);
    expect(favoriteService.getCount()).toBe(0);
  });

  test('should add favorite repository', async () => {
    const repoId = 'test-repo-1';

    await favoriteService.addFavorite(repoId);

    expect(favoriteService.isFavorite(repoId)).toBe(true);
    expect(favoriteService.getFavorites()).toContain(repoId);
    expect(favoriteService.getCount()).toBe(1);
  });

  test('should remove favorite repository', async () => {
    const repoId = 'test-repo-1';

    await favoriteService.addFavorite(repoId);
    expect(favoriteService.isFavorite(repoId)).toBe(true);

    await favoriteService.removeFavorite(repoId);
    expect(favoriteService.isFavorite(repoId)).toBe(false);
    expect(favoriteService.getCount()).toBe(0);
  });

  test('should toggle favorite status', async () => {
    const repoId = 'test-repo-1';

    // Initially not favorite
    expect(favoriteService.isFavorite(repoId)).toBe(false);

    // Toggle to favorite
    const result1 = await favoriteService.toggleFavorite(repoId);
    expect(result1).toBe(true);
    expect(favoriteService.isFavorite(repoId)).toBe(true);

    // Toggle back to not favorite
    const result2 = await favoriteService.toggleFavorite(repoId);
    expect(result2).toBe(false);
    expect(favoriteService.isFavorite(repoId)).toBe(false);
  });

  test('should not add duplicate favorites', async () => {
    const repoId = 'test-repo-1';

    await favoriteService.addFavorite(repoId);
    await favoriteService.addFavorite(repoId); // Add same repo again

    expect(favoriteService.getCount()).toBe(1);
    expect(favoriteService.getFavorites()).toEqual([repoId]);
  });

  test('should clear all favorites', async () => {
    await favoriteService.addFavorite('repo-1');
    await favoriteService.addFavorite('repo-2');
    expect(favoriteService.getCount()).toBe(2);

    await favoriteService.clearFavorites();
    expect(favoriteService.getCount()).toBe(0);
    expect(favoriteService.getFavorites()).toEqual([]);
  });

  test('should import and export favorites', async () => {
    const repoIds = ['repo-1', 'repo-2', 'repo-3'];

    await favoriteService.importFavorites(repoIds);
    expect(favoriteService.getCount()).toBe(3);
    expect(favoriteService.getFavorites()).toEqual(repoIds);

    const exported = favoriteService.exportFavorites();
    expect(exported).toEqual(repoIds);
  });
});
