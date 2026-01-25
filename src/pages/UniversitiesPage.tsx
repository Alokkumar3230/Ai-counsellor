import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, ExternalLink, Heart, Lock, Unlock, Star, Target as TargetIcon, CheckCircle } from 'lucide-react';
import {
  getUniversities,
  getShortlistedUniversities,
  getLockedUniversities,
  addToShortlist,
  removeFromShortlist,
  lockUniversity,
  unlockUniversity,
  updateUserStage,
} from '@/db/api';
import type { University, ShortlistedUniversity, LockedUniversity, UniversityCategory } from '@/types';
import { toast } from 'sonner';

export default function UniversitiesPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [universities, setUniversities] = useState<University[]>([]);
  const [shortlisted, setShortlisted] = useState<ShortlistedUniversity[]>([]);
  const [locked, setLocked] = useState<LockedUniversity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [categoryDialog, setCategoryDialog] = useState<{ open: boolean; university: University | null }>({
    open: false,
    university: null,
  });
  const [unlockDialog, setUnlockDialog] = useState<{ open: boolean; universityId: string | null }>({
    open: false,
    universityId: null,
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const [unis, short, lock] = await Promise.all([
        getUniversities(),
        getShortlistedUniversities(user.id),
        getLockedUniversities(user.id),
      ]);

      setUniversities(unis);
      setShortlisted(short);
      setLocked(lock);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load universities');
    } finally {
      setLoading(false);
    }
  };

  const isShortlisted = (universityId: string) => {
    return shortlisted.some((s) => s.university_id === universityId);
  };

  const isLocked = (universityId: string) => {
    return locked.some((l) => l.university_id === universityId);
  };

  const getShortlistCategory = (universityId: string): UniversityCategory | null => {
    const item = shortlisted.find((s) => s.university_id === universityId);
    return item?.category || null;
  };

  const handleAddToShortlist = async (university: University, category: UniversityCategory) => {
    if (!user) return;

    try {
      await addToShortlist(user.id, university.id, category);
      await loadData();
      
      // Update stage if needed
      if (profile?.current_stage === 'exploring') {
        await updateUserStage(user.id, 'shortlisting');
        await refreshProfile();
      }
      
      toast.success(`Added ${university.name} to your shortlist`);
      setCategoryDialog({ open: false, university: null });
    } catch (error) {
      console.error('Failed to add to shortlist:', error);
      toast.error('Failed to add to shortlist');
    }
  };

  const handleRemoveFromShortlist = async (universityId: string) => {
    if (!user) return;

    try {
      await removeFromShortlist(user.id, universityId);
      await loadData();
      toast.success('Removed from shortlist');
    } catch (error) {
      console.error('Failed to remove from shortlist:', error);
      toast.error('Failed to remove from shortlist');
    }
  };

  const handleLock = async (universityId: string) => {
    if (!user) return;

    try {
      await lockUniversity(user.id, universityId);
      await loadData();
      await refreshProfile();
      toast.success('University locked! You can now access application guidance.');
    } catch (error) {
      console.error('Failed to lock university:', error);
      toast.error('Failed to lock university');
    }
  };

  const handleUnlock = async () => {
    if (!user || !unlockDialog.universityId) return;

    try {
      await unlockUniversity(user.id, unlockDialog.universityId);
      await loadData();
      toast.success('University unlocked');
      setUnlockDialog({ open: false, universityId: null });
    } catch (error) {
      console.error('Failed to unlock university:', error);
      toast.error('Failed to unlock university');
    }
  };

  const filteredUniversities = universities.filter((uni) => {
    const matchesSearch =
      uni.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      uni.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      uni.city?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCountry = countryFilter === 'all' || uni.country === countryFilter;

    return matchesSearch && matchesCountry;
  });

  const countries = Array.from(new Set(universities.map((u) => u.country))).sort();

  const CategoryBadge = ({ category }: { category: UniversityCategory }) => {
    const config = {
      dream: { label: 'Dream', icon: Star, className: 'bg-warning/10 text-warning' },
      target: { label: 'Target', icon: TargetIcon, className: 'bg-primary/10 text-primary' },
      safe: { label: 'Safe', icon: CheckCircle, className: 'bg-success/10 text-success' },
    };

    const { label, icon: Icon, className } = config[category];

    return (
      <Badge variant="outline" className={className}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const UniversityCard = ({ university }: { university: University }) => {
    const shortlistedItem = isShortlisted(university.id);
    const lockedItem = isLocked(university.id);
    const category = getShortlistCategory(university.id);

    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg">{university.name}</CardTitle>
              <CardDescription>
                {university.city}, {university.country}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {category && <CategoryBadge category={category} />}
              {lockedItem && (
                <Badge variant="default" className="gap-1">
                  <Lock className="h-3 w-3" />
                  Locked
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Ranking</p>
              <p className="font-medium">#{university.ranking}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Acceptance Rate</p>
              <p className="font-medium">{university.acceptance_rate}%</p>
            </div>
            <div>
              <p className="text-muted-foreground">Tuition (Annual)</p>
              <p className="font-medium">
                {university.tuition_fee_min?.toLocaleString()} - {university.tuition_fee_max?.toLocaleString()}{' '}
                {university.currency}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Programs</p>
            <div className="flex flex-wrap gap-1">
              {university.programs.slice(0, 3).map((program) => (
                <Badge key={program} variant="secondary" className="text-xs">
                  {program}
                </Badge>
              ))}
              {university.programs.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{university.programs.length - 3} more
                </Badge>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {!shortlistedItem && !lockedItem && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => setCategoryDialog({ open: true, university })}
              >
                <Heart className="h-4 w-4 mr-2" />
                Add to Shortlist
              </Button>
            )}

            {shortlistedItem && !lockedItem && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRemoveFromShortlist(university.id)}
                >
                  Remove
                </Button>
                <Button size="sm" className="flex-1" onClick={() => handleLock(university.id)}>
                  <Lock className="h-4 w-4 mr-2" />
                  Lock Choice
                </Button>
              </>
            )}

            {lockedItem && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => setUnlockDialog({ open: true, universityId: university.id })}
              >
                <Unlock className="h-4 w-4 mr-2" />
                Unlock
              </Button>
            )}

            {university.website && (
              <Button size="sm" variant="ghost" asChild>
                <a href={university.website} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl xl:text-4xl font-bold mb-2">Discover Universities</h1>
          <p className="text-muted-foreground">
            Explore universities and build your shortlist with Dream, Target, and Safe options
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col xl:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search universities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-full xl:w-[200px]">
              <SelectValue placeholder="All Countries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {countries.map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Universities ({filteredUniversities.length})</TabsTrigger>
            <TabsTrigger value="shortlisted">Shortlisted ({shortlisted.length})</TabsTrigger>
            <TabsTrigger value="locked">Locked ({locked.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredUniversities.map((university) => (
                <UniversityCard key={university.id} university={university} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="shortlisted" className="space-y-4">
            {shortlisted.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No universities in your shortlist yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {shortlisted.map((item) =>
                  item.university ? <UniversityCard key={item.id} university={item.university} /> : null
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="locked" className="space-y-4">
            {locked.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No locked universities yet. Lock at least one to access application guidance.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {locked.map((item) =>
                  item.university ? <UniversityCard key={item.id} university={item.university} /> : null
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Category Selection Dialog */}
        <Dialog open={categoryDialog.open} onOpenChange={(open) => setCategoryDialog({ open, university: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add to Shortlist</DialogTitle>
              <DialogDescription>
                Choose a category for {categoryDialog.university?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start h-auto py-4"
                onClick={() => categoryDialog.university && handleAddToShortlist(categoryDialog.university, 'dream')}
              >
                <div className="text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="h-4 w-4 text-warning" />
                    <span className="font-semibold">Dream School</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Reach school, lower acceptance chance</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start h-auto py-4"
                onClick={() => categoryDialog.university && handleAddToShortlist(categoryDialog.university, 'target')}
              >
                <div className="text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <TargetIcon className="h-4 w-4 text-primary" />
                    <span className="font-semibold">Target School</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Good match, realistic chance</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start h-auto py-4"
                onClick={() => categoryDialog.university && handleAddToShortlist(categoryDialog.university, 'safe')}
              >
                <div className="text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="font-semibold">Safe School</span>
                  </div>
                  <p className="text-sm text-muted-foreground">High acceptance likelihood</p>
                </div>
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Unlock Confirmation Dialog */}
        <AlertDialog open={unlockDialog.open} onOpenChange={(open) => setUnlockDialog({ open, universityId: null })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unlock University?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to unlock this university? This will remove it from your committed list.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleUnlock}>Unlock</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
