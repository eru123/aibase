import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Plus, Building, Upload, X, Check, ChevronsUpDown } from "lucide-react";
import {
  Button,
  Input,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Modal,
  Label,
  DataTable,
  Avatar,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  ScrollArea,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { PhoneInput } from "@/components/ui/phone-input";
import { toast } from "sonner";
import { useOrganization } from "@/hooks/useOrganization";
import countriesData from "@srcjson/countries-states.json";
// import countryCodes from '@srcjson/countries-code.json' // Not needed here if PhoneInput handles it, but maybe useful? PhoneInput imports it internally.

interface Merchant {
  id: number;
  organization_id: number;
  name: string;
  email: string | null;
  avatar_url: string | null;
  contact_number: string | null;
  country: string | null;
  state: string | null;
  created_at: string;
}

interface Country {
  name: string;
  states: string[];
}

export default function MerchantsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { organization } = useOrganization();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [openCountry, setOpenCountry] = useState(false);
  const [openState, setOpenState] = useState(false);

  // Data State
  const [countries] = useState<Country[]>(countriesData as Country[]);
  const [states, setStates] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const fetchMerchants = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/organizations/${slug}/merchants`);
      setMerchants(response.data.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load merchants");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchMerchants();
    }
  }, [slug]);

  useEffect(() => {
    if (selectedCountry) {
      const country = countries.find((c) => c.name === selectedCountry);
      if (country) {
        setStates(country.states || []);
      } else {
        setStates([]);
      }
    } else {
      setStates([]);
    }
  }, [selectedCountry, countries]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("/api/uploads", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAvatarUrl(response.data.preview_url);
      toast.success("Avatar uploaded");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload avatar");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsCreating(true);
    try {
      await axios.post(`/api/organizations/${slug}/merchants`, {
        name: newName,
        email: newEmail,
        avatar_url: avatarUrl,
        contact_number: contactNumber || null,
        country: selectedCountry,
        state: selectedState,
      });
      toast.success("Merchant created");
      setIsCreateOpen(false);
      resetForm();
      fetchMerchants();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create merchant");
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setNewName("");
    setNewEmail("");
    setAvatarUrl("");
    setContactNumber("");
    setSelectedCountry("");
    setSelectedState("");
  };

  const canManage =
    organization?.organization_role === "owner" ||
    organization?.organization_role === "admin";

  const columns = useMemo(
    () => [
      {
        header: "Merchant Name",
        cell: (merchant: Merchant) => (
          <div className="flex items-center gap-3">
            <Avatar src={merchant.avatar_url} fallback={merchant.name} />
            <div className="flex flex-col">
              <span className="font-medium">{merchant.name}</span>
              {merchant.country && (
                <span className="text-xs text-muted-foreground">
                  {merchant.state ? `${merchant.state}, ` : ""}
                  {merchant.country}
                </span>
              )}
            </div>
          </div>
        ),
      },
      {
        header: "Contact",
        cell: (merchant: Merchant) => (
          <div className="flex flex-col text-sm">
            {merchant.email && (
              <span className="text-gray-900">{merchant.email}</span>
            )}
            {merchant.contact_number && (
              <span className="text-gray-500 text-xs">
                {merchant.contact_number}
              </span>
            )}
            {!merchant.email && !merchant.contact_number && (
              <span className="text-gray-400">-</span>
            )}
          </div>
        ),
      },
      {
        header: "Added On",
        cell: (merchant: Merchant) => (
          <div className="text-sm text-gray-500">
            {new Date(merchant.created_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            Merchants
          </h2>
          <p className="text-sm text-gray-500">
            Manage merchants for this organization.
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Merchant
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Merchants List</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={merchants}
            columns={columns}
            limit={10}
            searchKey="name"
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <Modal show={isCreateOpen} onClose={() => setIsCreateOpen(false)} sm>
        <div className="space-y-4">
          <div className="space-y-1.5 text-center sm:text-left">
            <h2 className="text-lg font-semibold leading-none tracking-tight">
              Add Merchant
            </h2>
            <p className="text-sm text-muted-foreground">
              Create a new merchant profile for this organization.
            </p>
          </div>

          <form onSubmit={handleCreate}>
            <div className="grid gap-4 py-4">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="relative group">
                  <Avatar src={avatarUrl} fallback={newName || "M"} size="xl" />
                  <label
                    htmlFor="avatar-upload"
                    className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                  >
                    <Upload className="h-6 w-6" />
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleUpload}
                      disabled={isUploading}
                    />
                  </label>
                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
                      <span className="loading loading-spinner loading-xs text-white">
                        ...
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  Click to upload avatar
                </span>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="name">Merchant Name</Label>
                <Input
                  id="name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Acme Corp"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="billing@acme.com"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="contact">Contact Number</Label>
                <PhoneInput
                  id="contact"
                  value={contactNumber}
                  onChange={setContactNumber}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Country</Label>
                  <Popover open={openCountry} onOpenChange={setOpenCountry}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCountry}
                        className={cn(
                          "w-full justify-between",
                          !selectedCountry && "text-muted-foreground",
                        )}
                      >
                        <span className="truncate text-left">
                          {selectedCountry || "Select Country"}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Search country..." />
                        <CommandList>
                          <CommandEmpty>No country found.</CommandEmpty>
                          <CommandGroup>
                            <ScrollArea className="h-[200px]">
                              {countries.map((country) => (
                                <CommandItem
                                  value={country.name}
                                  key={country.name}
                                  onSelect={() => {
                                    setSelectedCountry(country.name);
                                    setSelectedState("");
                                    setOpenCountry(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedCountry === country.name
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  {country.name}
                                </CommandItem>
                              ))}
                            </ScrollArea>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid gap-2">
                  <Label>State</Label>
                  <Popover open={openState} onOpenChange={setOpenState}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openState}
                        disabled={!selectedCountry || states.length === 0}
                        className={cn(
                          "w-full justify-between",
                          !selectedState && "text-muted-foreground",
                        )}
                      >
                        <span className="truncate text-left">
                          {selectedState || "Select State"}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Search state..." />
                        <CommandList>
                          <CommandEmpty>No state found.</CommandEmpty>
                          <CommandGroup>
                            <ScrollArea className="h-[200px]">
                              {states.map((state) => (
                                <CommandItem
                                  value={state}
                                  key={state}
                                  onSelect={() => {
                                    setSelectedState(state);
                                    setOpenState(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedState === state
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  {state}
                                </CommandItem>
                              ))}
                            </ScrollArea>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Merchant"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
